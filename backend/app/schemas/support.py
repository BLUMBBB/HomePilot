"""Support schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TicketCreate(BaseModel):
    subject: str
    message: str
    visit_id: UUID | None = None


class MessageCreate(BaseModel):
    body: str


class SupportMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_id: UUID
    author_id: UUID
    author_role: str
    body: str
    created_at: datetime


class SupportTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    visit_id: UUID | None
    subject: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: list[SupportMessageResponse] = []
