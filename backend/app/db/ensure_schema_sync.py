"""Идемпотентные изменения схемы после create_all (новые колонки в существующих таблицах)."""
from sqlalchemy import create_engine, text

from app.config import get_settings


def ensure_schema() -> None:
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    # Skip for SQLite — create_all() already handles all columns.
    if engine.dialect.name == 'sqlite':
        return
    ddl = text(
        """
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS personal_data_consent_at TIMESTAMP WITH TIME ZONE;
        """
    )
    with engine.begin() as conn:
        conn.execute(ddl)


if __name__ == "__main__":
    ensure_schema()
    print("Schema patch OK.")
