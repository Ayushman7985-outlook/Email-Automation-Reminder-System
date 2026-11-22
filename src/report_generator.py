import csv
from datetime import datetime
from .utils import OUTPUT_DIR, logger

REPORT_FILE = OUTPUT_DIR / "email_report.csv"
FIELDS = ["timestamp", "reminder_id", "email", "subject", "mode", "status", "details"]

def record_result(reminder, mode, status, details=""):
    exists = REPORT_FILE.exists()
    with open(REPORT_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if not exists:
            writer.writeheader()
        writer.writerow({
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "reminder_id": reminder.get("id", ""),
            "email": reminder.get("email", ""),
            "subject": reminder.get("subject", ""),
            "mode": mode,
            "status": status,
            "details": details,
        })
    logger.info("Report updated for %s: %s", reminder.get("id"), status)
