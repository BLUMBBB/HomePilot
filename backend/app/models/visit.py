"""Visit, VisitPhoto, VisitChecklistResult models."""
import enum
import uuid
from datetime import datetime, timezone, date, time

from sqlalchemy import DateTime, Date, Time, Enum, String, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VisitStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"
    rescheduled = "rescheduled"


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False
    )
    executor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    time_slot_start: Mapped[time] = mapped_column(Time, nullable=False)
    time_slot_end: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(Enum(VisitStatus), nullable=False, default=VisitStatus.scheduled)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reschedule_count_short: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    subscription = relationship("Subscription", back_populates="visits")
    executor = relationship("User", back_populates="executor_visits", foreign_keys=[executor_id])
    photos = relationship("VisitPhoto", back_populates="visit")
    checklist_results = relationship("VisitChecklistResult", back_populates="visit")


class VisitPhoto(Base):
    __tablename__ = "visit_photos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False
    )
    checklist_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("checklist_items.id", ondelete="SET NULL"), nullable=True
    )
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    visit = relationship("Visit", back_populates="photos")
    checklist_item = relationship("ChecklistItem", back_populates="visit_photos")


class VisitChecklistResult(Base):
    __tablename__ = "visit_checklist_results"
    __table_args__ = (UniqueConstraint("visit_id", "checklist_item_id", name="uq_visit_checklist_item"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False
    )
    checklist_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("checklist_items.id", ondelete="CASCADE"), nullable=False
    )
    done: Mapped[bool] = mapped_column(Boolean, nullable=False)
    photo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visit_photos.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    visit = relationship("Visit", back_populates="checklist_results")
    checklist_item = relationship("ChecklistItem", back_populates="visit_checklist_results")
