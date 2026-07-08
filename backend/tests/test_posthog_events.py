"""Tests that key business actions fire server-side PostHog events."""
import uuid

import pytest
from httpx import AsyncClient

from app.services import posthog_client


@pytest.fixture
def captured_events(monkeypatch):
    """Replace posthog_client.capture with a spy that records (event, properties)."""
    calls: list[tuple[str, str, dict]] = []

    async def _fake_capture(distinct_id, event, properties=None):
        calls.append((distinct_id, event, properties or {}))

    monkeypatch.setattr(posthog_client, "capture", _fake_capture)
    return calls


async def test_register_fires_server_event(client: AsyncClient, captured_events):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"u_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123",
            "accept_personal_data_processing": True,
        },
    )
    assert resp.status_code == 200
    events = [e for _, e, _ in captured_events]
    assert "server_user_registered" in events


async def test_login_fires_server_event(client: AsyncClient, verified_user, captured_events):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "TestPass123"},
    )
    assert resp.status_code == 200
    events = [e for _, e, _ in captured_events]
    assert "server_login" in events


async def test_failed_login_does_not_fire_event(client: AsyncClient, verified_user, captured_events):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "WrongPassword"},
    )
    assert resp.status_code == 401
    assert captured_events == []
