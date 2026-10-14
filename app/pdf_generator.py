import io
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_inventory_alert_pdf(alerts_queryset=None, single_alert=None):
    """
    Generates an executive, beautifully formatted PDF report for critical stock alerts.
    Hierarchy:
    1. Company Name (Minu Marketing) with Date in the corner
    2. Document Title: Critical Stock Alert Report
    3. Structured Stock Breakdown Table
    4. Official Advisory Note pushed to the bottom of the page
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Company Brand Header Typography
    company_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#11141C')
    )

    date_style = ParagraphStyle(
        'HeaderDate',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        alignment=2,  # Right aligned
        textColor=colors.HexColor('#64748B')
    )

    date_val_style = ParagraphStyle(
        'HeaderDateVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=2,  # Right aligned
        textColor=colors.HexColor('#1E293B')
    )

    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#991B1B'),
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=14
    )

    header_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    cell_style = ParagraphStyle(
        'BodyCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )

    cell_mono = ParagraphStyle(
        'MonoCell',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#2563EB')
    )

    badge_danger = ParagraphStyle(
        'BadgeDanger',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#DC2626')
    )

    badge_warning = ParagraphStyle(
        'BadgeWarning',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#D97706')
    )

    # 1. Company Header Table (Company Name Left, Date Right)
    current_date_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    header_table_data = [
        [
            Paragraph("Minu Marketing", company_style),
            Paragraph(f"<b>Issue Date:</b><br/>{current_date_str}", date_val_style)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[5.2 * inch, 2.3 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(header_table)

    # Thin separator line
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceAfter=14, spaceBefore=4))

    # 2. Document Heading
    story.append(Paragraph("CRITICAL STOCK ALERT REPORT", report_title_style))
    story.append(Paragraph("Automated Warehouse Requisition & Inventory Restocking Advisory", subtitle_style))

    # Determine alert items
    if single_alert:
        items = [single_alert]
    elif alerts_queryset is not None:
        items = list(alerts_queryset)
    else:
        items = []

    # 3. Structured Data Table
    table_data = [[
        Paragraph("SKU", header_cell),
        Paragraph("PRODUCT NAME", header_cell),
        Paragraph("CURRENT STOCK", header_cell),
        Paragraph("MIN THRESHOLD", header_cell),
        Paragraph("SEVERITY", header_cell),
        Paragraph("UNIT COST", header_cell),
        Paragraph("DEFICIT UNITS", header_cell)
    ]]

    for a in items:
        prod = a.product
        deficit = max(0, a.threshold - a.stock_at_trigger) if a.threshold else 0
        is_out = a.severity == 'OUT_OF_STOCK'
        sev_paragraph = Paragraph("OUT OF STOCK", badge_danger) if is_out else Paragraph("LOW STOCK", badge_warning)
        cost_str = f"Rs. {float(prod.cost_price):,.2f}" if prod else "Rs. 0.00"

        table_data.append([
            Paragraph(prod.sku if prod else 'N/A', cell_mono),
            Paragraph(prod.name if prod else 'N/A', cell_style),
            Paragraph(f"{a.stock_at_trigger} units", cell_style),
            Paragraph(f"{a.threshold} units", cell_style),
            sev_paragraph,
            Paragraph(cost_str, cell_style),
            Paragraph(f"Need {deficit} + {prod.reorder_quantity if prod else 50}", cell_style)
        ])

    table = Table(table_data, colWidths=[1.1 * inch, 2.0 * inch, 0.9 * inch, 0.9 * inch, 1.0 * inch, 0.8 * inch, 1.1 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#11141C')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))

    story.append(table)

    # 4. Push Note to bottom of page using dynamic Spacer
    # Calculate approx height of table to ensure note is seated at the bottom
    num_rows = len(table_data)
    spacer_height = max(1.5 * inch, 4.2 * inch - (num_rows * 0.28 * inch))
    story.append(Spacer(1, spacer_height))

    # Bottom Advisory Note
    note_border = HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#E2E8F0'), spaceAfter=8)
    story.append(note_border)

    note_style = ParagraphStyle(
        'BottomNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#64748B')
    )
    story.append(Paragraph(
        "<b>Important Procurement Note:</b> This document is an automatically generated inventory replenishment requisition issued by Minu Marketing IMS. "
        "Procurement officers are instructed to immediately verify supplier stock availability, lead times, and dispatch purchase orders "
        "for products marked with OUT OF STOCK severity to prevent disruption of operations.",
        note_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
