"""Apartment type schemas."""
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ApartmentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    duration_light_min: int
    duration_full_min: int
