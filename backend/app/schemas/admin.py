"""Тела запросов для админ-API."""
from typing import Optional
from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AdminUserPatch(BaseModel):
    is_active: Optional[bool] = None


class AdminSubscriptionPatch(BaseModel):
    executor_id: Optional[UUID] = None
    status: Optional[str] = None
    auto_renew: Optional[bool] = None
    preferred_days: Optional[list[int]] = None
    time_slot_start: Optional[time] = None
    time_slot_end: Optional[time] = None
    paused_until: Optional[datetime] = None

    @field_validator("preferred_days")
    @classmethod
    def validate_days(cls, v: Optional[list[int]]) -> Optional[list[int]]:
        if v is None:
            return v
        if not v or any(d < 1 or d > 7 for d in v):
            raise ValueError("preferred_days: числа от 1 до 7")
        return sorted(set(v))


class AdminVisitPatch(BaseModel):
    status: Optional[str] = Field(None, description="например cancelled")
    new_scheduled_date: Optional[date] = None
    new_time_slot_start: Optional[time] = None
    new_time_slot_end: Optional[time] = None


class AssignExecutorBody(BaseModel):
    executor_id: UUID


class SupportReplyBody(BaseModel):
    body: str = Field(..., min_length=1)


class SupportTicketStatusPatch(BaseModel):
    status: str


class ExecutorAdminPatch(BaseModel):
    executor_status: Optional[str] = None
    is_active: Optional[bool] = None
