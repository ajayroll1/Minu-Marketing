# REST API Specification (v1)

## Authentication Endpoints
- `POST /api/v1/auth/login/`: Authenticate user session.
- `POST /api/v1/auth/logout/`: Terminate session.
- `GET /api/v1/auth/me/`: Retrieve authenticated user identity and role.

## Products & Inventory
- `GET /api/v1/products/`: Paginated, filterable product list (`?search=`, `?status=`, `?category=`).
- `POST /api/v1/products/`: Create product with unique SKU.
- `GET /api/v1/products/{id}/`: Product details.
- `PATCH /api/v1/products/{id}/`: Update product metadata (cost, price, levels).
- `POST /api/v1/products/{id}/archive/`: Archive product.
- `POST /api/v1/products/{id}/restore/`: Restore archived product.

## Transactions & Ledger
- `GET /api/v1/stock-transactions/`: View transaction ledger history.
- `POST /api/v1/stock-transactions/`: Record stock movement (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`).
  - Payload:
    ```json
    {
      "product_id": 1,
      "transaction_type": "STOCK_IN",
      "quantity": 50,
      "reference_number": "PO-1093",
      "reason": "Replenishment delivery"
    }
    ```

## Alerts & Automation
- `GET /api/v1/alerts/`: View triggered low-stock and out-of-stock alerts.
- `POST /api/v1/alerts/{id}/acknowledge/`: Acknowledge alert.
- `POST /api/v1/alerts/{id}/resolve/`: Mark alert as resolved.

## Analytics & Reports
- `GET /api/v1/dashboard/summary/`: Real-time aggregated KPIs, category distribution, and critical threshold lists.
- `GET /api/v1/reports/export/{type}/`: Secure CSV export with formula injection prevention (`type`: `products`, `transactions`, `alerts`).

## Interactive OpenAPI Documentation
- Interactive Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI Raw Schema: `http://localhost:8000/api/schema/`
- Redoc UI: `http://localhost:8000/api/redoc/`
