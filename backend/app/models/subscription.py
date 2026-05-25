"""Subscription and SubscriptionPause models."""
import enum
import uuid
from datetime import datetime, timezone, date, time

from sqlalchemy import DateTime, Date, Time, Enum, String, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SubscriptionStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    tariff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tariffs.id", ondelete="RESTRICT"), nullable=False
    )
    apartment_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("apartment_types.id", ondelete="RESTRICT"), nullable=False
    )
    city_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    address_street: Mapped[str] = mapped_column(String(255), nullable=False)
    address_building: Mapped[str] = mapped_column(String(64), nullable=False)
    address_flat: Mapped[str] = mapped_column(String(64), nullable=False)
    address_entrance: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address_floor: Mapped[str | None] = mapped_column(String(16), nullable=True)
    address_doorcode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_days: Mapped[list] = mapped_column(JSONB, nullable=False)  # [1-7]
    time_slot_start: Mapped[time] = mapped_column(Time, nullable=False)
    time_slot_end: Mapped[time] = mapped_column(Time, nullable=False)
    premium_linen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    premium_plants: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    premium_ironing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.draft)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paused_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    executor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="subscriptions", foreign_keys=[user_id])
    tariff = relationship("Tariff", back_populates="subscriptions")
    apartment_type = relationship("ApartmentType", back_populates="subscriptions")
    city = relationship("City", back_populates="subscriptions")
    executor = relationship("User", foreign_keys=[executor_id])
    visits = relationship("Visit", back_populates="subscription")
    pauses = relationship("SubscriptionPause", back_populates="subscription")


class SubscriptionPause(Base):
    __tablename__ = "subscription_pauses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False
    )
    paused_from: Mapped[date] = mapped_column(Date, nullable=False)
    paused_to: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    subscription = relationship("Subscription", back_populates="pauses")
