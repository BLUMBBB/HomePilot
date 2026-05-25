"""Pydantic Settings — конфигурация из переменных окружения."""
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    APP_ENV: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    PORT: int = Field(default=8001, description="Порт сервера (по умолчанию 8001)")

    # JWT
    SECRET_KEY: str = Field(default="change-me-in-production-secret-key-min-32-chars")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/homepilot"
    )
    DATABASE_URL_SYNC: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/homepilot",
        description="Sync URL for Alembic",
    )

    # Redis (optional)
    REDIS_URL: str | None = Field(default=None)

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
            "http://127.0.0.1:3003",
        ],
        description="Comma-separated or JSON list of allowed origins",
    )

    # File storage
    UPLOAD_DIR: str = Field(default="./uploads", description="Local upload directory")
    MAX_UPLOAD_SIZE_MB: int = Field(default=10)
    # S3 (optional)
    S3_BUCKET: str | None = None
    S3_ENDPOINT: str | None = None
    AWS_ACCESS_KEY: str | None = None
    AWS_SECRET_KEY: str | None = None

    # Payment
    PAYMENT_PROVIDER: str = Field(default="mock", description="mock | stripe")
    PAYMENT_API_KEY: str | None = None
    PAYMENT_WEBHOOK_SECRET: str | None = None
    STRIPE_SECRET_KEY: str | None = Field(default=None, description="Secret key для Stripe API (test или live)")
    STRIPE_WEBHOOK_SECRET: str | None = Field(
        default=None,
        description="Signing secret для Stripe Webhooks (whsec_...)",
    )

    # Email
    SMTP_HOST: str | None = None
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAIL_FROM: str | None = None
    EMAIL_CONFIRM_TOKEN_EXPIRE_HOURS: int = Field(
        default=24, description="Срок жизни токена подтверждения email в часах (legacy)"
    )
    EMAIL_CONFIRM_CODE_EXPIRE_MINUTES: int = Field(
        default=15, description="Срок жизни 6-значного кода подтверждения email в минутах"
    )
    PAYMENT_CONFIRM_CODE_EXPIRE_MINUTES: int = Field(
        default=15, description="Срок жизни 6-значного кода подтверждения списания (тестовый платёж) в минутах"
    )
    FRONTEND_BASE_URL: str = Field(
        default="http://localhost:3003",
        description="Базовый URL фронтенда для ссылок в письмах",
    )

    # Locale
    LOCALE_DEFAULT: str = Field(default="ru", description="ru | kk")

    # Google Sign-In (GIS id_token) — тот же Client ID, что и на фронте (VITE_GOOGLE_CLIENT_ID).
    GOOGLE_CLIENT_ID: str | None = Field(default=None, description="OAuth 2.0 Client ID для проверки id_token")

    # Сид: учётки админ-панели (создаются только если пользователя с таким email ещё нет).
    SEED_ADMIN_EMAIL: str = Field(default="admin@homepilot.kz")
    SEED_ADMIN_PASSWORD: str = Field(default="admin123", min_length=8)
    SEED_SUPPORT_EMAIL: str = Field(default="support@homepilot.kz")
    SEED_SUPPORT_PASSWORD: str = Field(default="support123", min_length=8)


@lru_cache
def get_settings() -> Settings:
    return Settings()
