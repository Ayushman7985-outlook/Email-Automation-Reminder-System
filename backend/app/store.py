import json
from pathlib import Path
from threading import Lock
from uuid import uuid4
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
DATA.mkdir(exist_ok=True)
REMINDERS_FILE = DATA / "reminders.json"
CONTACTS_FILE = DATA / "contacts.json"
REPORT_FILE = BASE / "outputs" / "activity.json"
LOCK = Lock()

def read_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2), encoding="utf-8")

def reminders():
    return read_json(REMINDERS_FILE, [])

def save_reminders(items):
    write_json(REMINDERS_FILE, items)

def contacts():
    return read_json(CONTACTS_FILE, [])

def save_contacts(items):
    write_json(CONTACTS_FILE, items)

def activity():
    return read_json(REPORT_FILE, [])

def add_activity(item):
    with LOCK:
        rows = activity()
        item["id"] = str(uuid4())
        item["timestamp"] = datetime.now(timezone.utc).isoformat()
        rows.insert(0, item)
        write_json(REPORT_FILE, rows[:500])
