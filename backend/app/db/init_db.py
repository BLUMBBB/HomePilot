"""Создание таблиц при первом запуске (альтернатива Alembic для dev)."""
from app.db.base import Base
from app.db.session import engine


async def init_db() -> None:
    """Create all tables. В проде используйте Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
