"""Модель кода подтверждения списания (тестовый платёж — 6 цифр)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PaymentConfirmCode(Base):
    __tablename__ = "payment_confirm_codes"

    code: Mapped[str] = mapped_column(String(6), primary_key=True)
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    payment = relationship("Payment", back_populates="confirm_code")
