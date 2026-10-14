from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from app.models import Product, StockTransaction, LowStockAlert, AuditLog

class InventoryService:
    @staticmethod
    @transaction.atomic
    def process_transaction(product_id, transaction_type, quantity, unit_cost=None, reference_number='', reason='', user=None):
        """
        Executes an inventory transaction atomically, preventing race conditions via select_for_update,
        enforcing zero/positive stock boundaries, generating ledger logs and triggering low-stock alerts.
        """
        if quantity <= 0 and transaction_type in [StockTransaction.TYPE_IN, StockTransaction.TYPE_OUT]:
            raise ValidationError({'quantity': 'Quantity must be a positive integer.'})

        # Lock product row for concurrency control
        try:
            product = Product.objects.select_for_update().get(id=product_id)
        except Product.DoesNotExist:
            raise ValidationError({'product': 'Product not found.'})

        if product.status == Product.STATUS_ARCHIVED:
            raise ValidationError({'product': 'Cannot process transactions on archived products.'})

        before_stock = product.current_stock

        if transaction_type == StockTransaction.TYPE_IN:
            after_stock = before_stock + quantity
            if unit_cost is not None:
                product.cost_price = unit_cost
        elif transaction_type == StockTransaction.TYPE_OUT:
            if before_stock < quantity:
                raise ValidationError({
                    'quantity': f'Insufficient stock. Requested: {quantity}, Available: {before_stock}.'
                })
            after_stock = before_stock - quantity
        elif transaction_type in [StockTransaction.TYPE_ADJUSTMENT, StockTransaction.TYPE_CORRECTION]:
            # quantity represents the new absolute stock or adjustment count
            # Here we accept the new target count directly or delta
            # Let's standardize: quantity is the target physical count verified
            new_target_stock = quantity
            if new_target_stock < 0:
                raise ValidationError({'quantity': 'Adjusted physical stock cannot be negative.'})
            after_stock = new_target_stock
            quantity = after_stock - before_stock  # Net change
        elif transaction_type == StockTransaction.TYPE_REVERSAL:
            # Reversal operation
            after_stock = before_stock + quantity  # quantity can be negative or positive
            if after_stock < 0:
                raise ValidationError({'quantity': 'Reversal would cause inventory to become negative.'})
        else:
            raise ValidationError({'transaction_type': f'Invalid transaction type {transaction_type}'})

        # Enforce non-negative invariant
        if after_stock < 0:
            raise ValidationError({'quantity': 'Transaction would result in negative inventory balance.'})

        # Update product balance atomically
        product.current_stock = after_stock
        product.save()

        # Create Ledger Record
        ledger_entry = StockTransaction.objects.create(
            product=product,
            transaction_type=transaction_type,
            quantity=abs(quantity),
            before_stock=before_stock,
            after_stock=after_stock,
            unit_cost=unit_cost if unit_cost is not None else product.cost_price,
            reference_number=reference_number,
            reason=reason,
            performed_by=user,
        )

        # Audit event
        AuditLog.objects.create(
            user=user,
            action=f"STOCK_{transaction_type}",
            target_entity="Product",
            target_id=str(product.id),
            details={
                'sku': product.sku,
                'before': before_stock,
                'after': after_stock,
                'quantity': quantity,
                'reference': reference_number
            }
        )

        # Automated alert evaluation
        InventoryService.evaluate_low_stock_alerts(product)

        return ledger_entry

    @staticmethod
    def evaluate_low_stock_alerts(product):
        """
        Evaluates stock thresholds, creates or resolves alerts idempotently,
        and triggers automated SMTP email with PDF reports.
        """
        from app.email_service import send_alert_notification_email

        active_alerts = LowStockAlert.objects.filter(product=product, status__in=[LowStockAlert.STATUS_ACTIVE, LowStockAlert.STATUS_ACKNOWLEDGED])

        if product.current_stock == 0:
            # Out of stock
            if not active_alerts.filter(severity=LowStockAlert.SEVERITY_OUT).exists():
                active_alerts.delete()  # replace lower severity
                alert = LowStockAlert.objects.create(
                    product=product,
                    severity=LowStockAlert.SEVERITY_OUT,
                    status=LowStockAlert.STATUS_ACTIVE,
                    stock_at_trigger=product.current_stock,
                    threshold=product.min_stock_level,
                    notes=f"Critical: Product '{product.name}' is completely out of stock."
                )
                # Dispatch Email with PDF
                send_alert_notification_email(alert)
        elif product.current_stock <= product.min_stock_level:
            # Low stock
            if not active_alerts.filter(severity=LowStockAlert.SEVERITY_LOW).exists():
                active_alerts.delete()
                alert = LowStockAlert.objects.create(
                    product=product,
                    severity=LowStockAlert.SEVERITY_LOW,
                    status=LowStockAlert.STATUS_ACTIVE,
                    stock_at_trigger=product.current_stock,
                    threshold=product.min_stock_level,
                    notes=f"Warning: Stock level ({product.current_stock}) has reached or fallen below minimum threshold ({product.min_stock_level})."
                )
                # Dispatch Email with PDF
                send_alert_notification_email(alert)
        else:
            # Stock is healthy; auto-resolve any active alerts
            for alert in active_alerts:
                alert.status = LowStockAlert.STATUS_RESOLVED
                alert.resolved_at = timezone.now()
                alert.notes += " (Auto-resolved upon replenishment)"
                alert.save()

