import smtplib
from email.message import EmailMessage
from .config import SMTP_HOST, SMTP_PORT, EMAIL_SENDER, EMAIL_PASSWORD

def send_message(to_email: str, subject: str, body: str, dry_run: bool = True):
    if dry_run:
        return {"status": "simulated", "detail": "Dry run: no message was sent."}
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        raise RuntimeError("SMTP credentials are missing. Configure backend/.env first.")
    msg = EmailMessage()
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=25) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
    return {"status": "sent", "detail": "SMTP server accepted the message; inbox delivery is not guaranteed."}
