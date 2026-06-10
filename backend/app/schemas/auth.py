"""Auth request/response schemas."""
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _validate_password_complexity(v: str) -> str:
    if not any(c.isupper() for c in v):
        raise ValueError("Пароль должен содержать хотя бы одну заглавную букву")
    if not any(c.isdigit() for c in v):
        raise ValueError("Пароль должен содержать хотя бы одну цифру")
    return v


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"email": "client@example.com", "password": "MyPassword123"},
        }
    )

    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "newuser@example.com",
                "password": "SecurePass8",
                "name": "Айгерим",
                "phone": "+77001234567",
                "locale": "ru",
                "accept_personal_data_processing": True,
            }
        }
    )

    email: EmailStr
    password: str = Field(..., min_length=8)
    name: Optional[str] = None
    phone: Optional[str] = None
    locale: str = "ru"
    accept_personal_data_processing: bool = Field(
        ...,
        description="Подтверждение согласия на обработку персональных данных (обязательно).",
    )
    recaptcha_token: Optional[str] = Field(default=None, description="reCAPTCHA v3 token с фронтенда")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        return _validate_password_complexity(v)

    @field_validator("accept_personal_data_processing")
    @classmethod
    def consent_must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Необходимо согласие на обработку персональных данных")
        return v


class RegisterExecutorRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "invite_code": "EXECUTOR-INVITE-2026",
                "email": "executor@example.com",
                "password": "SecurePass8",
                "name": "Марат",
                "phone": "+77009876543",
                "accept_personal_data_processing": True,
            }
        }
    )

    invite_code: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: Optional[str] = None
    phone: Optional[str] = None
    accept_personal_data_processing: bool = Field(
        ...,
        description="Подтверждение согласия на обработку персональных данных (обязательно).",
    )
    recaptcha_token: Optional[str] = Field(default=None, description="reCAPTCHA v3 token с фронтенда")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        return _validate_password_complexity(v)

    @field_validator("accept_personal_data_processing")
    @classmethod
    def consent_must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Необходимо согласие на обработку персональных данных")
        return v


class RefreshRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"refresh_token": "<refresh_token_из_ответа_login>"},
        }
    )

    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"email": "client@example.com"}},
    )

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"token": "<токен_из_ссылки_или_ответа>", "new_password": "NewSecurePass8"},
        }
    )

    token: str
    new_password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ConfirmEmailRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"code": "482916"}},
    )

    code: str = Field(..., min_length=6, max_length=6, description="6-значный код из письма")


class GoogleSignInRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"id_token": "<credential.id_token_из_Google_OAuth>"},
        }
    )

    id_token: str = Field(..., min_length=20, description="JWT id_token из Google Identity Services")
