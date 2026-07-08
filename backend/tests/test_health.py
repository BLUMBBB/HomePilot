"""Tests for the health-check endpoint."""
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db
from app.main import create_app


async def test_health_returns_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert "version" in data


async def test_health_returns_503_when_db_ping_fails():
    """/health must reflect real DB connectivity, not just process liveness."""

    class _BrokenSession:
        async def execute(self, *args, **kwargs):
            raise RuntimeError("database unreachable")

    async def _broken_get_db():
        yield _BrokenSession()

    app = create_app()
    app.dependency_overrides[get_db] = _broken_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")

    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"] == "error"
