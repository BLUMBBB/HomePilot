"""Subscription schemas."""
import enum
from datetime import date, time, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def cleaning_type_to_str(value: object) -> str | None:
    """Тариф в БД может отдавать enum или str — нельзя вызывать .value у str."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, enum.Enum):
        return value.value
    return str(value)


class SubscriptionAddress(BaseModel):
    street: str
    building: str
    flat: str
    entrance: str | None = None
    floor: str | None = None
    doorcode: str | None = None
    comment: str | None = None


class SubscriptionCreate(BaseModel):
    tariff_id: UUID
    apartment_type_id: UUID
    city_id: UUID
    address_street: str
    address_building: str
    address_flat: str
    address_entrance: str | None = None
    address_floor: str | None = None
    address_doorcode: str | None = None
    address_comment: str | None = None
    preferred_days: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])  # 1-7, по умолчанию будни
    time_slot_start: time = Field(default_factory=lambda: time(10, 0))
    time_slot_end: time = Field(default_factory=lambda: time(13, 0))
    premium_linen: bool = False
    premium_plants: bool = False
    premium_ironing: bool = False
    accept_offer: bool = Field(..., description="Must be true")


class SubscriptionUpdate(BaseModel):
    address_street: str | None = None
    address_building: str | None = None
    address_flat: str | None = None
    address_entrance: str | None = None
    address_floor: str | None = None
    address_doorcode: str | None = None
    address_comment: str | None = None
    preferred_days: list[int] | None = None
    time_slot_start: time | None = None
    time_slot_end: time | None = None
    premium_linen: bool | None = None
    premium_plants: bool | None = None
    premium_ironing: bool | None = None
    paused_until: datetime | None = None
    status: str | None = None  # cancelled
    auto_renew: bool | None = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    tariff_id: UUID
    apartment_type_id: UUID
    city_id: UUID
    address_street: str
    address_building: str
    address_flat: str
    status: str
    preferred_days: list[int]
    time_slot_start: time
    time_slot_end: time
    premium_linen: bool
    premium_plants: bool
    premium_ironing: bool
    started_at: datetime | None
    ends_at: datetime | None
    paused_until: datetime | None
    executor_id: UUID | None
    auto_renew: bool
    price_month_kzt: int | None = None  # computed


class SubscriptionOut(SubscriptionResponse):
    """Ответ API: базовые поля + вычисляемые из тарифа/типа квартиры."""

    tariff_cleaning_type: str | None = None
    apartment_type_duration_light_min: int | None = None
    apartment_type_duration_full_min: int | None = None
