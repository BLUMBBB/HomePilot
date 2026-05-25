"""Создание всех таблиц (sync) — для Docker/старта без миграций."""
from sqlalchemy import create_engine

from app.config import get_settings
from app.db.base import Base
from app.db.ensure_schema_sync import ensure_schema
from app import models  # noqa: F401 — регистрация моделей в metadata


def create_all() -> None:
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    Base.metadata.create_all(engine)
    ensure_schema()


if __name__ == "__main__":
    create_all()
    print("Tables created.")
