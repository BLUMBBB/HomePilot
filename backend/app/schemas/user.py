from typing import Optional
"""User schemas."""
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    locale: str = "ru"


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    locale: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: Optional[str]
    phone: Optional[str]
    role: str
    locale: str
    is_active: bool
    photo_url: Optional[str] = None
    executor_status: Optional[str] = None
