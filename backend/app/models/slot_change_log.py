from typing import Optional
"""Audit log for visit slot changes."""
import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import Date, DateTime, ForeignKey, String, Time, Text
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SlotChangeLog(Base):
    __tablename__ = "slot_change_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    changed_by_user_id: Mapped[uuid.Optional[UUID]] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    changed_by_role: Mapped[str] = mapped_column(String(32), nullable=False, default="system")
    reason: Optional[Mapped[str]] = mapped_column(Text, nullable=True)

    old_date: Mapped[date] = mapped_column(Date, nullable=False)
    old_start: Mapped[time] = mapped_column(Time, nullable=False)
    old_end: Mapped[time] = mapped_column(Time, nullable=False)
    new_date: Mapped[date] = mapped_column(Date, nullable=False)
    new_start: Mapped[time] = mapped_column(Time, nullable=False)
    new_end: Mapped[time] = mapped_column(Time, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    visit = relationship("Visit")
    changed_by_user = relationship("User")
