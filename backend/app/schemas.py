from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional

class ReminderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    scheduled_at: str
    recurrence: Literal["once", "daily", "weekly"] = "once"
    status: Optional[str] = "scheduled"

class SendTestRequest(BaseModel):
    email: EmailStr
    subject: str = "Email Automation test"
    message: str = "This is a test message from Email Automation & Reminder System."
    dry_run: bool = True
