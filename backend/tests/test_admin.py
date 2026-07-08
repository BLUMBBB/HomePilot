"""Tests for RBAC on /api/v1/admin endpoints."""
from httpx import AsyncClient

from app.models.user import User


async def test_admin_stats_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 403


async def test_admin_stats_rejects_client_role(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/admin/stats", headers=auth_headers)
    assert resp.status_code == 403


async def test_admin_stats_allows_admin(client: AsyncClient, admin_headers: dict):
    resp = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert resp.status_code == 200


async def test_admin_list_users_rejects_client_role(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert resp.status_code == 403


async def test_admin_list_users_allows_admin(
    client: AsyncClient, admin_headers: dict, verified_user: User
):
    resp = await client.get("/api/v1/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


async def test_admin_patch_user_rejects_client_role(
    client: AsyncClient, auth_headers: dict, verified_user: User
):
    resp = await client.patch(
        f"/api/v1/admin/users/{verified_user.id}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert resp.status_code == 403
