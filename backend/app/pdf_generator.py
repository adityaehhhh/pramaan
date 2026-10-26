import io
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
)
from reportlab.pdfgen import canvas
from backend.app.config import settings

class NumberedCanvas(canvas.Canvas):
    """Custom canvas that adds page numbers and prominent DEMO watermark."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_watermark_and_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_watermark_and_footer(self, page_count):
        self.saveState()
        
        # Draw prominent diagonal DEMO watermark
        self.setFont("Helvetica-Bold", 42)
        self.setFillColor(colors.HexColor("#CBD5E1"), alpha=0.35)
        self.translate(306, 396)
        self.rotate(45)
        self.drawCentredString(0, 0, "DEMO RECORD • NOT OFFICIAL")
        self.setFont("Helvetica", 18)
        self.drawCentredString(0, -32, "PRAMAAN PROTOTYPE PLATFORM")
        self.restoreState()

        # Draw footer
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 25, "PRAMAAN Digital Academic Records Platform (Demonstration Environment).")
        self.drawRightString(576, 25, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_marksheet_pdf(document, student, institution, subjects) -> bytes:
    """
    Generates a print-ready academic marksheet with DEMO branding,
    subjects table, SGPA/CGPA summary, and verification QR code.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        alignment=1  # Centered
    )
    
    sub_title_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1
    )
    
    badge_style = ParagraphStyle(
        'DemoBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#DC2626'),
        alignment=1
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    cell_regular = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # 1. Header with PRAMAAN branding & Institution Info
    header_data = [
        [
            Paragraph("<b>PRAMAAN</b><br/><font size='7' color='#2563EB'>DIGITAL ACADEMIC RECORDS</font>", cell_bold),
            Paragraph(f"<b>{institution.name}</b><br/><font size='8' color='#64748B'>{institution.type} • {institution.state}</font>", sub_title_style),
            Paragraph("<b>PROTOTYPE</b><br/><font size='7' color='#DC2626'>DEMO SYSTEM</font>", badge_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[120, 320, 100])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # 2. Document Title
    story.append(Paragraph(f"ACADEMIC GRADE SHEET / MARKSHEET", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Semester {document.semester} Examination • Academic Session {document.academic_year}", sub_title_style))
    story.append(Spacer(1, 14))

    # 3. Student & Document Metadata Grid
    meta_data = [
        [
            Paragraph("<b>Student Name:</b>", cell_bold),
            Paragraph(student.full_name, cell_regular),
            Paragraph("<b>Document ID:</b>", cell_bold),
            Paragraph(document.document_id, cell_regular),
        ],
        [
            Paragraph("<b>PRAMAAN ID:</b>", cell_bold),
            Paragraph(student.student_identifier, cell_regular),
            Paragraph("<b>Roll Number:</b>", cell_bold),
            Paragraph(student.roll_number, cell_regular),
        ],
        [
            Paragraph("<b>Program / Degree:</b>", cell_bold),
            Paragraph(student.program_name, cell_regular),
            Paragraph("<b>Registration No:</b>", cell_bold),
            Paragraph(student.registration_number or "N/A", cell_regular),
        ],
        [
            Paragraph("<b>Department:</b>", cell_bold),
            Paragraph(student.department, cell_regular),
            Paragraph("<b>Issue Date:</b>", cell_bold),
            Paragraph(document.issued_at.strftime("%d-%b-%Y"), cell_regular),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 4. Subjects & Marks Table
    subject_rows = [
        [
            Paragraph("<b>Code</b>", cell_bold),
            Paragraph("<b>Course Title</b>", cell_bold),
            Paragraph("<b>Credits</b>", cell_bold),
            Paragraph("<b>Internal</b>", cell_bold),
            Paragraph("<b>External</b>", cell_bold),
            Paragraph("<b>Total</b>", cell_bold),
            Paragraph("<b>Grade</b>", cell_bold),
            Paragraph("<b>Points</b>", cell_bold),
            Paragraph("<b>Result</b>", cell_bold),
        ]
    ]

    for sub in subjects:
        subject_rows.append([
            Paragraph(sub.subject_code, cell_regular),
            Paragraph(sub.subject_name, cell_regular),
            Paragraph(str(sub.credits), cell_regular),
            Paragraph(str(int(sub.internal_marks)), cell_regular),
            Paragraph(str(int(sub.external_marks)), cell_regular),
            Paragraph(f"<b>{int(sub.total_marks)}</b>/{int(sub.max_marks)}", cell_regular),
            Paragraph(f"<b>{sub.grade}</b>", cell_regular),
            Paragraph(str(sub.grade_points), cell_regular),
            Paragraph(f"<font color='{'#15803D' if sub.result == 'P' else '#B91C1C'}'><b>{sub.result}</b></font>", cell_bold),
        ])

    sub_table = Table(
        subject_rows,
        colWidths=[55, 195, 40, 45, 45, 55, 40, 35, 30]
    )
    sub_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(sub_table)
    story.append(Spacer(1, 14))

    # 5. Result Summary Card
    total_creds = sum(s.credits for s in subjects) if subjects else 0
    summary_data = [
        [
            Paragraph("<b>Semester Credits:</b> " + str(total_creds), cell_regular),
            Paragraph(f"<b>SGPA:</b> <font size='10' color='#1E40AF'><b>{document.sgpa or 'N/A'}</b></font>", cell_regular),
            Paragraph(f"<b>CGPA:</b> <font size='10' color='#1E40AF'><b>{document.cgpa or 'N/A'}</b></font>", cell_regular),
            Paragraph(f"<b>Overall Status:</b> <font color='{'#15803D' if document.result_status == 'PASS' else '#B91C1C'}'><b>{document.result_status}</b></font>", cell_bold),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[130, 130, 130, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BFDBFE')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # 6. QR Code and Cryptographic Verification Footer
    verify_url = f"{settings.FRONTEND_URL}/verify?id={document.document_id}"
    qr_img = qrcode.make(verify_url, box_size=4, border=1)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    reportlab_qr = Image(qr_buffer, width=1.1*inch, height=1.1*inch)

    disclaimer_text = (
        "<b>CRYPTOGRAPHIC INTEGRITY & VERIFICATION:</b><br/>"
        f"This document is registered on the PRAMAAN demo platform under ID <b>{document.document_id}</b>.<br/>"
        f"<b>Hash:</b> <font size='6.5' color='#475569'>{document.sha256_hash or 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</font><br/>"
        "Scan the QR code to verify this demo credential directly against the digital registry.<br/>"
        "<i>Notice: This is a proposed prototype platform and does not constitute an official GoI / university degree.</i>"
    )

    qr_section_data = [
        [
            reportlab_qr,
            Paragraph(disclaimer_text, cell_regular)
        ]
    ]
    qr_table = Table(qr_section_data, colWidths=[90, 450])
    qr_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('LEFTPADDING', (1, 0), (1, -1), 10),
    ]))
    story.append(KeepTogether([qr_table]))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
