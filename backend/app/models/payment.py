"""Payment model."""
from typing import Optional
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String, Integer, ForeignKey
from sqlalchemy import Uuid as UUID, JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[uuid.Optional[UUID]] = mapped_column(
        UUID(), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True
    )
    amount_kzt: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="KZT", nullable=False)
    status: Mapped[str] = mapped_column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # в ТЗ — metadata; имя metadata зарезервировано в SQLAlchemy
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    confirm_code = relationship(
        "PaymentConfirmCode", back_populates="payment", uselist=False, cascade="all, delete-orphan"
    )
