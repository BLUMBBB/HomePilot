"""User schemas."""
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
    phone: str | None = None
    locale: str = "ru"


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    locale: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str | None
    phone: str | None
    role: str
    locale: str
    is_active: bool
    photo_url: str | None = None
    executor_status: str | None = None
