"""ChecklistTemplate and ChecklistItem models."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CleaningType(str, enum.Enum):
    light = "light"
    full = "full"


class ChecklistTemplate(Base):
    __tablename__ = "checklist_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cleaning_type: Mapped[str] = mapped_column(Enum(CleaningType), nullable=False)
    apartment_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("apartment_types.id", ondelete="SET NULL"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    items = relationship("ChecklistItem", back_populates="template", order_by="ChecklistItem.sort_order")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("checklist_templates.id", ondelete="CASCADE"), nullable=False
    )
    title_ru: Mapped[str] = mapped_column(String(512), nullable=False)
    title_kk: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    template = relationship("ChecklistTemplate", back_populates="items")
    visit_photos = relationship("VisitPhoto", back_populates="checklist_item")
    visit_checklist_results = relationship("VisitChecklistResult", back_populates="checklist_item")
