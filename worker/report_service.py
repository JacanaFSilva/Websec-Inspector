"""
Geração de relatório PDF (RF09) e envio por e-mail (RF10).
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

log = logging.getLogger("report_service")

REPORTS_DIR = os.getenv("REPORTS_DIR", "/data/reports")
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
REPORT_FROM_EMAIL = os.getenv("REPORT_FROM_EMAIL", "no-reply@websec-inspector.local")


def generate_pdf_report(scan_id: int, hostname: str, findings: list[dict]) -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)
    path = os.path.join(REPORTS_DIR, f"scan-{scan_id}.pdf")

    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("WebSec Inspector — Relatório de Segurança", styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Domínio analisado: {hostname}", styles["Normal"]),
        Paragraph(f"Scan ID: {scan_id}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph(f"Total de achados: {len(findings)}", styles["Heading2"]),
        Spacer(1, 12),
    ]

    table_data = [["Categoria", "Descrição", "CVSS", "Recomendação"]]
    for f in findings:
        table_data.append([
            f["owasp_category"],
            f["description"],
            f"{f['cvss_score']:.1f}",
            f["recommendation"],
        ])

    table = Table(table_data, colWidths=[80, 180, 40, 180])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(table)

    doc.build(story)
    log.info("Relatório PDF gerado em %s", path)
    return path


def send_report_email(scan_id: int, pdf_path: str, to_email: str | None = None):
    to_email = to_email or os.getenv("REPORT_TEST_RECIPIENT", "usuario@exemplo.com")

    msg = MIMEMultipart()
    msg["From"] = REPORT_FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = f"WebSec Inspector — Relatório do scan #{scan_id}"

    body = (
        "Olá,\n\nSegue em anexo o relatório de segurança referente à sua "
        f"varredura (scan #{scan_id}).\n\nEquipe WebSec Inspector."
    )
    msg.attach(MIMEText(body, "plain"))

    with open(pdf_path, "rb") as f:
        part = MIMEApplication(f.read(), _subtype="pdf")
        part.add_header("Content-Disposition", "attachment", filename=os.path.basename(pdf_path))
        msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USER:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        log.info("Relatório do scan %s enviado para %s", scan_id, to_email)
    except Exception:
        log.exception("Falha ao enviar e-mail do scan %s (fluxo do scan não é interrompido)", scan_id)
