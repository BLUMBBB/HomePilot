"""ApartmentType model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApartmentType(Base):
    __tablename__ = "apartment_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kk: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_light_min: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_full_min: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    tariff_prices = relationship("TariffPrice", back_populates="apartment_type")
    subscriptions = relationship("Subscription", back_populates="apartment_type")
