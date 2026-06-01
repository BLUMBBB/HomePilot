"""Tests for /api/v1/auth endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_confirm_code import EmailConfirmCode
from app.models.user import User


def _reg_payload(email: str | None = None, **overrides) -> dict:
    return {
        "email": email or f"u_{uuid.uuid4().hex[:8]}@test.com",
        "password": "TestPass123",
        "accept_personal_data_processing": True,
        **overrides,
    }


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json=_reg_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert "user" in data
    assert data["user"]["role"] == "client"
    assert "message" in data


async def test_register_duplicate_email(client: AsyncClient):
    payload = _reg_payload()
    resp1 = await client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 200

    resp2 = await client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409


async def test_register_without_consent(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json=_reg_payload(accept_personal_data_processing=False),
    )
    assert resp.status_code == 422


async def test_register_short_password(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json=_reg_payload(password="short"),
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

async def test_login_requires_email_verification(client: AsyncClient):
    email = f"unverified_{uuid.uuid4().hex[:8]}@test.com"
    await client.post("/api/v1/auth/register", json=_reg_payload(email=email))

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "TestPass123"},
    )
    assert resp.status_code == 403


async def test_login_success(client: AsyncClient, verified_user: User):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "TestPass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == verified_user.email


async def test_login_wrong_password(client: AsyncClient, verified_user: User):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "WrongPassword"},
    )
    assert resp.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "TestPass123"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Email confirmation (full register → confirm → login flow)
# ---------------------------------------------------------------------------

async def test_confirm_email_and_login(
    client: AsyncClient,
    db: AsyncSession,
):
    email = f"confirm_{uuid.uuid4().hex[:8]}@test.com"
    reg = await client.post("/api/v1/auth/register", json=_reg_payload(email=email))
    assert reg.status_code == 200
    user_id = reg.json()["user"]["id"]

    from uuid import UUID
    result = await db.execute(
        select(EmailConfirmCode).where(EmailConfirmCode.user_id == UUID(user_id))
    )
    code_rec = result.scalar_one()

    confirm = await client.post(
        "/api/v1/auth/confirm-email",
        json={"code": code_rec.code},
    )
    assert confirm.status_code == 200

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "TestPass123"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


async def test_confirm_email_invalid_code(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/confirm-email",
        json={"code": "000000"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

async def test_refresh_valid_token(client: AsyncClient, verified_user: User):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "TestPass123"},
    )
    refresh_token = login.json()["refresh_token"]

    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_refresh_invalid_token(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "not.a.valid.jwt"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------

async def test_forgot_password_always_200(client: AsyncClient):
    for email in ["exists@test.com", "nobody_here@test.com"]:
        resp = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": email},
        )
        assert resp.status_code == 200
        assert "message" in resp.json()
