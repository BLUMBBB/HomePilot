"""Tariff schemas."""
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TariffPriceSchema(BaseModel):
    apartment_type_id: UUID
    apartment_type_code: str | None = None
    price_month_kzt: int


class TariffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    cleaning_type: str
    visits_per_month: int
    has_linen: bool
    has_plants: bool
    has_ironing: bool
    is_active: bool
    sort_order: int
    prices: list[TariffPriceSchema] = []
