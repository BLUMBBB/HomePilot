"""Subscription service: create, activate, pause, cancel, generate visits."""
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Subscription, TariffPrice, Visit
from app.models.subscription import SubscriptionStatus
from app.models.visit import VisitStatus
from app.services import visit as visit_service


async def get_price_for_subscription(
    db: AsyncSession, tariff_id, apartment_type_id
) -> int | None:
    result = await db.execute(
        select(TariffPrice.price_month_kzt).where(
            TariffPrice.tariff_id == tariff_id,
            TariffPrice.apartment_type_id == apartment_type_id,
        )
    )
    row = result.scalar_one_or_none()
    return row if row is not None else None


async def load_subscription_eager(
    db: AsyncSession,
    subscription_id: UUID,
    *,
    with_city: bool = False,
    with_user: bool = False,
    with_executor: bool = False,
    with_visits: bool = False,
) -> Subscription:
    """Повторная загрузка подписки с нужными связями (без async-unsafe lazy load после flush)."""
    opts = [
        selectinload(Subscription.tariff),
        selectinload(Subscription.apartment_type),
    ]
    if with_city:
        opts.append(selectinload(Subscription.city))
    if with_user:
        opts.append(selectinload(Subscription.user))
    if with_executor:
        opts.append(selectinload(Subscription.executor))
    if with_visits:
        opts.append(selectinload(Subscription.visits))
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id).options(*opts)
    )
    return result.scalar_one()


async def create_subscription(db: AsyncSession, user_id, payload) -> tuple[Subscription, int]:
    price = await get_price_for_subscription(
        db, payload.tariff_id, payload.apartment_type_id
    )
    if price is None:
        from app.core.exceptions import AppException
        raise AppException("Недопустимая комбинация тариф/тип квартиры", status_code=400)
    sub = Subscription(
        user_id=user_id,
        tariff_id=payload.tariff_id,
        apartment_type_id=payload.apartment_type_id,
        city_id=payload.city_id,
        address_street=payload.address_street,
        address_building=payload.address_building,
        address_flat=payload.address_flat,
        address_entrance=payload.address_entrance,
        address_floor=payload.address_floor,
        address_doorcode=payload.address_doorcode,
        address_comment=payload.address_comment,
        preferred_days=payload.preferred_days,
        time_slot_start=payload.time_slot_start,
        time_slot_end=payload.time_slot_end,
        premium_linen=payload.premium_linen,
        premium_plants=payload.premium_plants,
        premium_ironing=payload.premium_ironing,
        status=SubscriptionStatus.draft,
    )
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub, price


def generate_visits_for_period(
    subscription: Subscription,
    from_date: date,
    to_date: date,
    visits_per_month: int,
) -> list[tuple[date, time, time]]:
    """Генерирует даты и слоты визитов. По preferred_days и time_slot или равномерно по периоду (заполнители для настройки в ЛК)."""
    slots = []
    preferred = subscription.preferred_days or []
    if preferred:
        current = from_date
        while current <= to_date and len(slots) < visits_per_month:
            if current.isoweekday() in preferred and not (
                subscription.paused_until and subscription.paused_until.date() and current <= subscription.paused_until.date()
            ):
                slots.append((current, subscription.time_slot_start, subscription.time_slot_end))
            current += timedelta(days=1)
        return slots[:visits_per_month]
    # Нет предпочтительных дней — создаём N слотов равномерно по периоду (даты потом пользователь настроит в ЛК)
    delta_days = max(1, (to_date - from_date).days)
    step = max(1, delta_days // visits_per_month)
    for i in range(visits_per_month):
        d = from_date + timedelta(days=min(i * step, delta_days))
        if d <= to_date:
            slots.append((d, subscription.time_slot_start, subscription.time_slot_end))
    return slots[:visits_per_month]


async def ensure_active_subscription_dates(db: AsyncSession, sub: Subscription) -> None:
    """Проставляет started_at и ends_at активным подпискам, у которых они не заданы (старые записи)."""
    if sub.status != SubscriptionStatus.active or sub.started_at is not None:
        return
    now = sub.created_at or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    sub.started_at = now
    sub.ends_at = now + timedelta(days=30)
    await db.flush()


async def activate_subscription(db: AsyncSession, subscription_id) -> Subscription:
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    sub = result.scalar_one_or_none()
    if not sub or sub.status != SubscriptionStatus.draft:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Подписка не найдена или уже активирована")
    now = datetime.now(timezone.utc)
    sub.status = SubscriptionStatus.active
    sub.started_at = now
    sub.ends_at = now + timedelta(days=30)
    await db.flush()
    # Load tariff for visits_per_month
    from app.models import Tariff
    t = await db.get(Tariff, sub.tariff_id)
    from_d = sub.started_at.date()
    to_d = sub.ends_at.date() if sub.ends_at else (from_d + timedelta(days=30))
    slots = generate_visits_for_period(sub, from_d, to_d, t.visits_per_month)
    for d, start, end in slots:
        visit = Visit(
            subscription_id=sub.id,
            executor_id=sub.executor_id,
            scheduled_date=d,
            time_slot_start=start,
            time_slot_end=end,
            status=VisitStatus.scheduled,
        )
        db.add(visit)
    await db.flush()
    # Автоназначение исполнителя, если не задан вручную
    if sub.executor_id is None:
        res = await db.execute(
            select(Visit).where(Visit.subscription_id == sub.id).order_by(Visit.scheduled_date)
        )
        for v in res.scalars().all():
            await visit_service.assign_executor(db, v, sub.city_id)
    await db.refresh(sub)
    return sub
