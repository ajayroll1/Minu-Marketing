# Database Design & Ledger Architecture

## 1. Schema Specifications
The database schema enforces data integrity, non-negative invariants, and auditability.

### Primary Entities
1. **Product (`app_product`)**
   - `id`: BigAutoField (Primary Key)
   - `name`: VarChar(200)
   - `sku`: VarChar(80) (Unique, Indexed)
   - `category_id`: ForeignKey to `Category` (SET_NULL)
   - `supplier_id`: ForeignKey to `Supplier` (SET_NULL)
   - `unit_of_measure`: VarChar(30)
   - `cost_price`: Decimal(12, 2) (>= 0.00)
   - `selling_price`: Decimal(12, 2) (>= 0.00)
   - `current_stock`: Integer (>= 0)
   - `min_stock_level`: Integer (>= 0)
   - `reorder_quantity`: Integer (>= 0)
   - `status`: VarChar(20) [ACTIVE, ARCHIVED]

2. **StockTransaction (`app_stocktransaction`)**
   - `id`: BigAutoField
   - `product_id`: ForeignKey to `Product` (PROTECT)
   - `transaction_type`: VarChar(20) [STOCK_IN, STOCK_OUT, ADJUSTMENT, CORRECTION, REVERSAL]
   - `quantity`: Integer
   - `before_stock`: Integer
   - `after_stock`: Integer
   - `unit_cost`: Decimal(12, 2)
   - `reference_number`: VarChar(100)
   - `reason`: TextField
   - `performed_by_id`: ForeignKey to `auth_user`
   - `created_at`: DateTime (Auto, Indexed)

3. **LowStockAlert (`app_lowstockalert`)**
   - `id`: BigAutoField
   - `product_id`: ForeignKey to `Product` (CASCADE)
   - `severity`: VarChar(20) [LOW_STOCK, OUT_OF_STOCK]
   - `status`: VarChar(20) [ACTIVE, ACKNOWLEDGED, RESOLVED]
   - `stock_at_trigger`: Integer
   - `threshold`: Integer
   - `notes`: TextField
   - `resolved_by_id`: ForeignKey to `auth_user`
   - `resolved_at`: DateTime (Nullable)

4. **AuditLog (`app_auditlog`)**
   - `id`: BigAutoField
   - `user_id`: ForeignKey to `auth_user`
   - `action`: VarChar(100)
   - `target_entity`: VarChar(100)
   - `target_id`: VarChar(100)
   - `details`: JSONField
   - `created_at`: DateTime (Auto)

## 2. Invariants & Concurrency Handling
- **Zero-Negative Invariant**: Outbound stock requests that exceed `current_stock` are rejected at the service level before any state mutation can occur.
- **Atomic Row-Level Locking**: `InventoryService.process_transaction` runs inside `@transaction.atomic` and applies `Product.objects.select_for_update().get(id=product_id)`, preventing double-spending race conditions.
- **Append-Only Ledger**: Transactions are immutable. Physical adjustments record the prior stock, new verified count, difference, and audit justification.
