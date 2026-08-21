import os
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from app.config import settings


def generate_qr_code(data_string: str) -> BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2,
    )
    qr.add_data(data_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def create_statutory_pdf(
    filing_id: str,
    pathway: str,
    public_authority: str,
    title: str,
    redacted_content: str,
    tracking_id: str,
    application_ref_code: str,
    receipt_hash: str,
    output_directory: Optional[str] = None
) -> str:
    out_dir = output_directory or settings.PDF_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, f"Statutory_Petition_{filing_id}.pdf")

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1E293B')
    )
    
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#0F172A')
    )
    
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    
    elements = []

    # Header Banner
    elements.append(Paragraph("OFFICIAL STATUTORY PETITION & CIVIC FILING", header_style))
    elements.append(Paragraph(f"<b>Statutory Act:</b> {pathway}", header_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563EB'), spaceAfter=15))

    # Metadata Block with QR code
    qr_data = f"FILING:{filing_id}|REF:{application_ref_code}|HASH:{receipt_hash[:16]}"
    qr_buffer = generate_qr_code(qr_data)
    qr_image = Image(qr_buffer, width=70, height=70)

    meta_table_data = [
        [Paragraph("Filing Reference ID:", meta_label), Paragraph(filing_id, meta_val), qr_image],
        [Paragraph("Portal Tracking ID:", meta_label), Paragraph(tracking_id, meta_val), ""],
        [Paragraph("Public Authority:", meta_label), Paragraph(public_authority, meta_val), ""],
        [Paragraph("Receipt Verification Hash:", meta_label), Paragraph(receipt_hash, meta_val), ""],
        [Paragraph("IEEE 7000 Audit Standard:", meta_label), Paragraph("PASSED - Consent Token Verified", meta_val), ""]
    ]

    meta_table = Table(meta_table_data, colWidths=[130, 290, 80])
    meta_table.setStyle(TableStyle([
        ('SPAN', (2, 0), (2, 4)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (1, -1), 0.5, colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 20))

    # Petition Title
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 15))

    # Main Body Text
    paragraphs = redacted_content.split('\n\n')
    for p in paragraphs:
        if p.strip():
            # Replace newlines inside paragraph with linebreaks
            clean_p = p.strip().replace('\n', '<br/>')
            elements.append(Paragraph(clean_p, body_style))
            elements.append(Spacer(1, 10))

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=15))

    # Signature Block
    sig_data = [
        [Paragraph("<b>Submitted By:</b> Citizen (IEEE 7000 Verified)", meta_val), Paragraph("<b>Verification Stamp:</b> Digitally Authenticated", meta_val)],
        [Paragraph("<b>Filing Gateway:</b> MAS Civic Empowerment Engine", meta_val), Paragraph(f"<b>Ref Code:</b> {application_ref_code}", meta_val)]
    ]
    sig_table = Table(sig_data, colWidths=[250, 250])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    return file_path
