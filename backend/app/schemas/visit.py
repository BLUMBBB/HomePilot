"""Visit schemas."""
from typing import Optional
from datetime import date, time, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class VisitRescheduleRequest(BaseModel):
    new_scheduled_date: date
    new_time_slot_start: time
    new_time_slot_end: time


class VisitComplaintRequest(BaseModel):
    subject: str
    message: str


class ChecklistResultItem(BaseModel):
    checklist_item_id: UUID
    done: bool
    photo_id: Optional[UUID] = None


class VisitCompleteRequest(BaseModel):
    results: list[ChecklistResultItem]


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subscription_id: UUID
    executor_id: Optional[UUID]
    scheduled_date: date
    time_slot_start: time
    time_slot_end: time
    status: str
    completed_at: Optional[datetime]
    client_rating: Optional[int]
    reschedule_count_short: int
