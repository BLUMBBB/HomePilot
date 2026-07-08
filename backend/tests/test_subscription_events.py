"""Tests that activating a subscription fires a server-side PostHog event."""
import uuid
from datetime import time

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.apartment_type import ApartmentType
from app.models.city import City
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.tariff import CleaningType, Tariff
from app.models.user import User
from app.services import posthog_client
from app.services.subscription import activate_subscription


@pytest.fixture
def captured_events(monkeypatch):
    calls: list[tuple[str, str, dict]] = []

    async def _fake_capture(distinct_id, event, properties=None):
        calls.append((distinct_id, event, properties or {}))

    monkeypatch.setattr(posthog_client, "capture", _fake_capture)
    return calls


async def _make_draft_subscription(db: AsyncSession, user: User) -> Subscription:
    suffix = uuid.uuid4().hex[:8]
    tariff = Tariff(
        code=f"tariff_{suffix}",
        name_ru="Тест",
        name_kk="Тест",
        cleaning_type=CleaningType.light,
        visits_per_month=1,
    )
    apartment_type = ApartmentType(
        code=f"apt_{suffix}",
        name_ru="Тест",
        name_kk="Тест",
        duration_light_min=60,
        duration_full_min=120,
    )
    city = City(code=f"city_{suffix}", name_ru="Тест", name_kk="Тест")
    db.add_all([tariff, apartment_type, city])
    await db.flush()

    sub = Subscription(
        user_id=user.id,
        tariff_id=tariff.id,
        apartment_type_id=apartment_type.id,
        city_id=city.id,
        address_street="Test",
        address_building="1",
        address_flat="1",
        preferred_days=[1, 3, 5],
        time_slot_start=time(10, 0),
        time_slot_end=time(12, 0),
        status=SubscriptionStatus.draft,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def test_activate_subscription_fires_server_event(
    db: AsyncSession, verified_user: User, captured_events
):
    sub = await _make_draft_subscription(db, verified_user)

    activated = await activate_subscription(db, sub.id)

    assert activated.status == SubscriptionStatus.active
    events = [e for _, e, _ in captured_events]
    assert "server_subscription_activated" in events
