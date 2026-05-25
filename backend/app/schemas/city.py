"""City schemas."""
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str  # name_ru or name_kk by locale
