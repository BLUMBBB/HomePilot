"""Subscription schemas."""
from typing import Optional
import enum
from datetime import date, time, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def cleaning_type_to_str(value: object) -> Optional[str]:
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
    entrance: Optional[str] = None
    floor: Optional[str] = None
    doorcode: Optional[str] = None
    comment: Optional[str] = None


class SubscriptionCreate(BaseModel):
    tariff_id: UUID
    apartment_type_id: UUID
    city_id: UUID
    address_street: str
    address_building: str
    address_flat: str
    address_entrance: Optional[str] = None
    address_floor: Optional[str] = None
    address_doorcode: Optional[str] = None
    address_comment: Optional[str] = None
    preferred_days: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])  # 1-7, по умолчанию будни
    time_slot_start: time = Field(default_factory=lambda: time(10, 0))
    time_slot_end: time = Field(default_factory=lambda: time(13, 0))
    premium_linen: bool = False
    premium_plants: bool = False
    premium_ironing: bool = False
    accept_offer: bool = Field(..., description="Must be true")


class SubscriptionUpdate(BaseModel):
    address_street: Optional[str] = None
    address_building: Optional[str] = None
    address_flat: Optional[str] = None
    address_entrance: Optional[str] = None
    address_floor: Optional[str] = None
    address_doorcode: Optional[str] = None
    address_comment: Optional[str] = None
    preferred_days: Optional[list[int]] = None
    time_slot_start: Optional[time] = None
    time_slot_end: Optional[time] = None
    premium_linen: Optional[bool] = None
    premium_plants: Optional[bool] = None
    premium_ironing: Optional[bool] = None
    paused_until: Optional[datetime] = None
    status: Optional[str] = None  # cancelled
    auto_renew: Optional[bool] = None


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
    started_at: Optional[datetime]
    ends_at: Optional[datetime]
    paused_until: Optional[datetime]
    executor_id: Optional[UUID]
    auto_renew: bool
    price_month_kzt: Optional[int] = None  # computed


class SubscriptionOut(SubscriptionResponse):
    """Ответ API: базовые поля + вычисляемые из тарифа/типа квартиры."""

    tariff_cleaning_type: Optional[str] = None
    apartment_type_duration_light_min: Optional[int] = None
    apartment_type_duration_full_min: Optional[int] = None
