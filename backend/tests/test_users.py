"""Tests for /api/v1/me endpoints."""
from httpx import AsyncClient

from app.models.user import User


async def test_get_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/me")
    assert resp.status_code == 403


async def test_get_me_success(client: AsyncClient, verified_user: User, auth_headers: dict):
    resp = await client.get("/api/v1/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == str(verified_user.id)
    assert data["email"] == verified_user.email
    assert data["role"] == "client"


async def test_update_me_name(client: AsyncClient, auth_headers: dict):
    resp = await client.patch(
        "/api/v1/me",
        json={"name": "Updated Name"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


async def test_update_me_locale(client: AsyncClient, auth_headers: dict):
    resp = await client.patch(
        "/api/v1/me",
        json={"locale": "kk"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["locale"] == "kk"


async def test_change_password_wrong_current(
    client: AsyncClient, auth_headers: dict
):
    resp = await client.post(
        "/api/v1/me/change-password",
        json={"current_password": "WrongCurrent", "new_password": "NewPass123"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


async def test_change_password_success(
    client: AsyncClient,
    verified_user: User,
    auth_headers: dict,
):
    resp = await client.post(
        "/api/v1/me/change-password",
        json={"current_password": "TestPass123", "new_password": "NewPass456"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "message" in resp.json()

    # New password works for login
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "NewPass456"},
    )
    assert login.status_code == 200
