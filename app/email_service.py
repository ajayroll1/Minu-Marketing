import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from app.pdf_generator import generate_inventory_alert_pdf

logger = logging.getLogger(__name__)

def send_alert_notification_email(alert, recipient_email=None):
    """
    Sends an executive HTML alert email to the recipient with an attached,
    beautifully formatted PDF report containing complete SKU, available units,
    and replenishment advice.
    """
    recipient = recipient_email or getattr(settings, 'ALERT_RECIPIENT_EMAIL', 'admin@example.com')
    product = alert.product

    severity_label = "CRITICAL OUT OF STOCK" if alert.severity == 'OUT_OF_STOCK' else "LOW STOCK WARNING"
    subject = f"[{severity_label}] Stock Alert: {product.name} ({product.sku})"

    # Plaintext fallback
    text_content = f"""
INVENTORY PRO - CRITICAL STOCK ALERT

Alert Level: {severity_label}
Product: {product.name}
SKU: {product.sku}
Current Stock Remaining: {product.current_stock} units
Minimum Configured Threshold: {product.min_stock_level} units
Category: {product.category.name if product.category else 'N/A'}
Supplier: {product.supplier.name if product.supplier else 'N/A'}
Unit Cost: Rs. {product.cost_price}

Notes: {alert.notes}

Please find the detailed PDF replenishment report attached.
"""

    # Top-notch HTML email template
    badge_color = "#DC2626" if alert.severity == 'OUT_OF_STOCK' else "#D97706"
    badge_bg = "#FEE2E2" if alert.severity == 'OUT_OF_STOCK' else "#FEF3C7"

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }}
    .container {{ max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
    .header {{ background-color: #111C2D; color: #FFFFFF; padding: 24px 32px; }}
    .header h2 {{ margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.3px; }}
    .header p {{ margin: 0; font-size: 0.82rem; color: #94A3B8; }}
    .content {{ padding: 32px; }}
    .alert-banner {{ background-color: {badge_bg}; border: 1px solid {badge_color}33; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }}
    .alert-banner h3 {{ margin: 0 0 4px 0; font-size: 0.96rem; color: {badge_color}; font-weight: 800; }}
    .alert-banner p {{ margin: 0; font-size: 0.84rem; color: #475569; }}
    .table-box {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem; }}
    .table-box td {{ padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }}
    .table-box td.label {{ font-weight: 700; color: #64748B; width: 40%; }}
    .table-box td.value {{ font-weight: 600; color: #0F172A; }}
    .stock-highlight {{ font-size: 1.15rem; font-weight: 800; color: {badge_color}; }}
    .footer {{ background-color: #F8FAFC; padding: 18px 32px; text-align: center; font-size: 0.78rem; color: #64748B; border-top: 1px solid #E2E8F0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Minu Marketing — Inventory Alert System</h2>
      <p>Automated Real-Time Warehouse Telemetry & Replenishment Requisition</p>
    </div>
    <div class="content">
      <div class="alert-banner">
        <h3>🚨 {severity_label}</h3>
        <p>{alert.notes}</p>
      </div>

      <table class="table-box">
        <tr>
          <td class="label">Product Name</td>
          <td class="value">{product.name}</td>
        </tr>
        <tr>
          <td class="label">SKU Identifier</td>
          <td class="value"><code style="font-family: monospace; color: #2563EB;">{product.sku}</code></td>
        </tr>
        <tr>
          <td class="label">Current Available Units</td>
          <td class="value stock-highlight">{product.current_stock} units remaining</td>
        </tr>
        <tr>
          <td class="label">Configured Threshold</td>
          <td class="value">{product.min_stock_level} units</td>
        </tr>
        <tr>
          <td class="label">Product Category</td>
          <td class="value">{product.category.name if product.category else 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Supplier Partner</td>
          <td class="value">{product.supplier.name if product.supplier else 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Unit Cost Valuation</td>
          <td class="value">₹{float(product.cost_price):,.2f}</td>
        </tr>
      </table>

      <div style="background-color: #F1F5F9; padding: 14px; border-radius: 8px; font-size: 0.82rem; color: #475569;">
        <strong>Attached Document:</strong> An executive PDF report (<code>Stock_Alert_{product.sku}.pdf</code>) with comprehensive replenishment calculations and requisition data has been generated and attached below.
      </div>
    </div>
    <div class="footer">
      Sent automatically by Minu Marketing IMS &bull; SMTP Notification Daemon
    </div>
  </div>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'alerts@inventorypro.com'),
            to=[recipient]
        )
        msg.attach_alternative(html_content, "text/html")

        # Generate and attach the PDF
        pdf_bytes = generate_inventory_alert_pdf(single_alert=alert)
        msg.attach(f"Stock_Alert_{product.sku}.pdf", pdf_bytes, "application/pdf")

        msg.send(fail_silently=False)
        logger.info(f"Alert notification email with PDF sent successfully to {recipient} for SKU {product.sku}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email alert for {product.sku}: {str(e)}")
        return False
