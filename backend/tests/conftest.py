"""Shared pytest fixtures for HomePilot backend tests."""
import os

# Must be set before any app imports so session.py picks up the test DB URL.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/homepilot_test",
)
os.environ.setdefault(
    "DATABASE_URL_SYNC",
    "postgresql://postgres:postgres@localhost:5432/homepilot_test",
)
os.environ.setdefault("SECRET_KEY", "test-secret-key-at-least-32-characters-long")

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
from app.models.user import User, UserRole

_async_engine = create_async_engine(os.environ["DATABASE_URL"], echo=False)
_session_factory = async_sessionmaker(_async_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def db_setup():
    """Ensure all tables exist before the test session starts."""
    sync_url = os.environ["DATABASE_URL_SYNC"]
    engine = create_engine(sync_url, echo=False)
    Base.metadata.create_all(engine, checkfirst=True)
    engine.dispose()


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    async with _session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client():
    app = create_app()

    async def _override_get_db():
        async with _session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def verified_user(db: AsyncSession) -> User:
    """A pre-verified client with a known password."""
    user = User(
        email=f"user_{uuid.uuid4().hex[:8]}@test.com",
        password_hash=get_password_hash("TestPass123"),
        role=UserRole.client,
        name="Test User",
        locale="ru",
        is_active=True,
        email_verified_at=datetime.now(timezone.utc),
        personal_data_consent_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
def auth_headers(verified_user: User) -> dict[str, str]:
    """Bearer token headers for the verified_user fixture."""
    access_token, _ = create_access_token(verified_user.id, verified_user.role.value)
    return {"Authorization": f"Bearer {access_token}"}
