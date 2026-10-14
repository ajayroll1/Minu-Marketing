import pytest
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from app.models import Category, Supplier, Product, StockTransaction, LowStockAlert, UserProfile
from app.services import InventoryService

@pytest.mark.django_db
class TestInventoryCore:
    def setup_method(self):
        self.user = User.objects.create_user(username='testadmin', password='password123')
        self.profile = UserProfile.objects.create(user=self.user, role=UserProfile.ROLE_ADMIN)
        self.category = Category.objects.create(name='Test Category')
        self.supplier = Supplier.objects.create(name='Test Supplier')
        self.product = Product.objects.create(
            name='Test Widget',
            sku='TEST-WDG-01',
            category=self.category,
            supplier=self.supplier,
            cost_price=Decimal('10.00'),
            selling_price=Decimal('20.00'),
            current_stock=50,
            min_stock_level=15,
            reorder_quantity=50
        )

    def test_stock_in_increases_inventory_and_logs_ledger(self):
        tx = InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_IN,
            quantity=25,
            reference_number='PO-1001',
            reason='Receiving new batch',
            user=self.user
        )
        self.product.refresh_from_db()
        assert self.product.current_stock == 75
        assert tx.before_stock == 50
        assert tx.after_stock == 75
        assert tx.quantity == 25
        assert StockTransaction.objects.filter(product=self.product).count() == 1

    def test_stock_out_decreases_inventory(self):
        tx = InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_OUT,
            quantity=20,
            reference_number='SO-5001',
            reason='Customer order fulfillment',
            user=self.user
        )
        self.product.refresh_from_db()
        assert self.product.current_stock == 30
        assert tx.before_stock == 50
        assert tx.after_stock == 30

    def test_negative_stock_prevention(self):
        """Strict invariant: an outbound transaction exceeding stock must be rejected with ValidationError"""
        with pytest.raises(ValidationError):
            InventoryService.process_transaction(
                product_id=self.product.id,
                transaction_type=StockTransaction.TYPE_OUT,
                quantity=100,  # exceeds available 50
                user=self.user
            )
        self.product.refresh_from_db()
        assert self.product.current_stock == 50  # Stock unaffected

    def test_automated_low_stock_alert_generation(self):
        # Reduce stock from 50 to 10 (min_stock_level is 15)
        InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_OUT,
            quantity=40,
            user=self.user
        )
        self.product.refresh_from_db()
        assert self.product.current_stock == 10
        alert = LowStockAlert.objects.filter(product=self.product, status=LowStockAlert.STATUS_ACTIVE).first()
        assert alert is not None
        assert alert.severity == LowStockAlert.SEVERITY_LOW

    def test_automated_out_of_stock_alert_transition(self):
        # Empty stock completely
        InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_OUT,
            quantity=50,
            user=self.user
        )
        self.product.refresh_from_db()
        assert self.product.current_stock == 0
        alert = LowStockAlert.objects.filter(product=self.product, status=LowStockAlert.STATUS_ACTIVE).first()
        assert alert is not None
        assert alert.severity == LowStockAlert.SEVERITY_OUT

    def test_auto_resolution_upon_replenishment(self):
        # Deplete then replenish
        InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_OUT,
            quantity=50,
            user=self.user
        )
        assert LowStockAlert.objects.filter(product=self.product, status=LowStockAlert.STATUS_ACTIVE).exists()

        # Replenish with 100 units
        InventoryService.process_transaction(
            product_id=self.product.id,
            transaction_type=StockTransaction.TYPE_IN,
            quantity=100,
            user=self.user
        )
        # Alert should now be resolved
        assert not LowStockAlert.objects.filter(product=self.product, status=LowStockAlert.STATUS_ACTIVE).exists()
        resolved = LowStockAlert.objects.filter(product=self.product, status=LowStockAlert.STATUS_RESOLVED).first()
        assert resolved is not None
