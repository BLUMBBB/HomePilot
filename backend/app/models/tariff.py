"""Tariff and TariffPrice models."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CleaningType(str, enum.Enum):
    light = "light"
    full = "full"


class Tariff(Base):
    __tablename__ = "tariffs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kk: Mapped[str] = mapped_column(String(255), nullable=False)
    cleaning_type: Mapped[str] = mapped_column(Enum(CleaningType), nullable=False)
    visits_per_month: Mapped[int] = mapped_column(Integer, nullable=False)
    has_linen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_plants: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_ironing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    prices = relationship("TariffPrice", back_populates="tariff")
    subscriptions = relationship("Subscription", back_populates="tariff")


class TariffPrice(Base):
    __tablename__ = "tariff_prices"
    __table_args__ = (UniqueConstraint("tariff_id", "apartment_type_id", name="uq_tariff_apartment"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tariff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tariffs.id", ondelete="CASCADE"), nullable=False
    )
    apartment_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("apartment_types.id", ondelete="CASCADE"), nullable=False
    )
    price_month_kzt: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    tariff = relationship("Tariff", back_populates="prices")
    apartment_type = relationship("ApartmentType", back_populates="tariff_prices")
