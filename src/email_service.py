import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from jinja2 import Template

from .utils import TEMPLATE_DIR, logger

load_dotenv()

def create_email(contact, reminder):
    template_path = TEMPLATE_DIR / "email_template.txt"
    with open(template_path, encoding="utf-8") as f:
        template_text = f.read()

    body = Template(template_text).render(
        name=contact.get("name", "there"),
        department=contact.get("department", "Not specified"),
        task=reminder.get("task", ""),
        reminder_id=reminder.get("id", ""),
    )

    msg = EmailMessage()
    msg["Subject"] = reminder["subject"]
    msg["From"] = os.getenv("EMAIL_SENDER", "student@example.com")
    msg["To"] = reminder["email"]
    msg.set_content(body)
    return msg

def send_email(message, dry_run=True):
    if dry_run:
        logger.info("DRY RUN: Email was NOT sent.")
        logger.info("To: %s", message["To"])
        logger.info("Subject: %s", message["Subject"])
        logger.info("Body:\n%s", message.get_content())
        return "SIMULATED", "Dry-run mode; no email sent"

    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))

    if not sender or not password:
        raise ValueError("EMAIL_SENDER and EMAIL_PASSWORD must be configured in .env")

    with smtplib.SMTP(host, port, timeout=30) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(message)

    logger.info("SMTP accepted message for %s", message["To"])
    return "SENT", "SMTP accepted the message (delivery to inbox is not guaranteed)"
