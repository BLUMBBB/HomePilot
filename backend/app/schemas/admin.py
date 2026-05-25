"""Тела запросов для админ-API."""
from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AdminUserPatch(BaseModel):
    is_active: bool | None = None


class AdminSubscriptionPatch(BaseModel):
    executor_id: UUID | None = None
    status: str | None = None
    auto_renew: bool | None = None
    preferred_days: list[int] | None = None
    time_slot_start: time | None = None
    time_slot_end: time | None = None
    paused_until: datetime | None = None

    @field_validator("preferred_days")
    @classmethod
    def validate_days(cls, v: list[int] | None) -> list[int] | None:
        if v is None:
            return v
        if not v or any(d < 1 or d > 7 for d in v):
            raise ValueError("preferred_days: числа от 1 до 7")
        return sorted(set(v))


class AdminVisitPatch(BaseModel):
    status: str | None = Field(None, description="например cancelled")
    new_scheduled_date: date | None = None
    new_time_slot_start: time | None = None
    new_time_slot_end: time | None = None


class AssignExecutorBody(BaseModel):
    executor_id: UUID


class SupportReplyBody(BaseModel):
    body: str = Field(..., min_length=1)


class SupportTicketStatusPatch(BaseModel):
    status: str


class ExecutorAdminPatch(BaseModel):
    executor_status: str | None = None
    is_active: bool | None = None
