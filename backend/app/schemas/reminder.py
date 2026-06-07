from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date as date_type, time as time_type
import re

class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str
    time: str
    repeat_type: Optional[str] = "none"
    priority: Optional[str] = "medium"
    category: Optional[str] = "general"

    @field_validator('date')
    def validate_date(cls, v):
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

    @field_validator('time')
    def validate_time(cls, v):
        if not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

class ReminderCreate(ReminderBase):
    is_ai_generated: Optional[bool] = False

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    repeat_type: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    status: str
    is_ai_generated: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
