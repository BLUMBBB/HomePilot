"""Tests for public read-only endpoints (no auth required)."""
from httpx import AsyncClient


async def test_get_cities(client: AsyncClient):
    resp = await client.get("/api/v1/cities")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_get_tariffs(client: AsyncClient):
    resp = await client.get("/api/v1/tariffs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_get_apartment_types(client: AsyncClient):
    resp = await client.get("/api/v1/apartment-types")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_legal_offer(client: AsyncClient):
    resp = await client.get("/api/v1/legal/offer")
    assert resp.status_code == 200
