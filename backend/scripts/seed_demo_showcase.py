#!/usr/bin/env python3
"""
Живые демо-данные для витрины (клиенты, подписки, визиты, поддержка, доп. исполнители).

Запуск в контейнере backend (WORKDIR=/app):
  python scripts/seed_demo_showcase.py

Идемпотентность: если пользователь demo.live01@homepilot.kz уже есть — скрипт выходит без изменений.
Пароль для всех demo.live* клиентов и исполнителей один (см. DEMO_PASSWORD ниже).

Не вызывайте на боевых данных без понимания: создаётся ~10 клиентов, ~4 доп. исполнителя,
подписки, десятки визитов и тикеты поддержки.
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

# Запуск из каталога backend или /app в Docker
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.db.session import async_session_maker  # noqa: E402
from app.models import (
    Subscription,
    SupportTicket,
    SupportMessage,
    User,
    ExecutorZone,
    City,
    Tariff,
    ApartmentType,
)
from app.models.subscription import SubscriptionStatus  # noqa: E402
from app.models.visit import Visit, VisitStatus  # noqa: E402
from app.models.support import TicketStatus  # noqa: E402
from app.models.user import UserRole, ExecutorStatus  # noqa: E402

ANCHOR_EMAIL = "demo.live01@homepilot.kz"
DEMO_PASSWORD = "DemoLive2026!"
DEMO_TAG = "demo.live"  # префикс в email для идентификации набора


CLIENT_ROWS: list[tuple[str, str]] = [
    ("demo.live01@homepilot.kz", "Айжан Серикова"),
    ("demo.live02@homepilot.kz", "Ерлан Нурбаев"),
    ("demo.live03@homepilot.kz", "Дана Омарова"),
    ("demo.live04@homepilot.kz", "Максат Жумабаев"),
    ("demo.live05@homepilot.kz", "Алина Ким"),
    ("demo.live06@homepilot.kz", "Бекжан Абдуллин"),
    ("demo.live07@homepilot.kz", "Ляззат Шынгысова"),
    ("demo.live08@homepilot.kz", "Тимур Сагатов"),
    ("demo.live09@homepilot.kz", "Жанеля Бекмурза"),
    ("demo.live10@homepilot.kz", "Данияр Олжасұлы"),
]

EXTRA_EXECUTORS: list[tuple[str, str]] = [
    ("demo.live.exec4@homepilot.kz", "Қанат Ерімбет"),
    ("demo.live.exec5@homepilot.kz", "Сабина Рахметова"),
    ("demo.live.exec6@homepilot.kz", "Нұрлан Жәнібеков"),
    ("demo.live.exec7@homepilot.kz", "Жұлдыз Абдрахманова"),
]


async def already_seeded(session) -> bool:
    r = await session.execute(select(User.id).where(User.email == ANCHOR_EMAIL))
    return r.scalar_one_or_none() is not None


async def load_refs(session):
    city = (
        await session.execute(select(City).where(City.code == "almaty"))
    ).scalar_one_or_none()
    if not city:
        raise RuntimeError("Город almaty не найден — сначала выполните python -m app.db.seed")

    tariffs = {}
    for code in ("start", "basic", "optimum", "comfort", "premium"):
        t = (
            await session.execute(select(Tariff).where(Tariff.code == code))
        ).scalar_one_or_none()
        if t:
            tariffs[code] = t

    apt_list = (
        await session.execute(select(ApartmentType).order_by(ApartmentType.code))
    ).scalars().all()
    apt_by_code = {a.code: a for a in apt_list}
    if not apt_by_code:
        raise RuntimeError("Нет типов квартир — выполните seed.")

    settings = get_settings()
    support_user = (
        await session.execute(select(User).where(User.email == settings.SEED_SUPPORT_EMAIL))
    ).scalar_one_or_none()

    return city, tariffs, apt_by_code, support_user


async def ensure_extra_executors(session, city: City, now: datetime) -> None:
    ph = get_password_hash(DEMO_PASSWORD)
    for email, name in EXTRA_EXECUTORS:
        r = await session.execute(select(User).where(User.email == email))
        if r.scalar_one_or_none():
            continue
        session.add(
            User(
                email=email,
                password_hash=ph,
                role=UserRole.executor,
                name=name,
                executor_status=ExecutorStatus.active,
                email_verified_at=now,
                personal_data_consent_at=now,
            )
        )
    await session.flush()

    executors = (
        await session.execute(select(User).where(User.role == UserRole.executor))
    ).scalars().all()
    for u in executors:
        r = await session.execute(
            select(ExecutorZone).where(ExecutorZone.executor_id == u.id, ExecutorZone.city_id == city.id)
        )
        if r.scalar_one_or_none():
            continue
        session.add(
            ExecutorZone(
                executor_id=u.id,
                city_id=city.id,
                zone_name="Алматы",
            )
        )
    await session.flush()


async def list_executor_ids(session) -> list[UUID]:
    rows = (
        await session.execute(
            select(User.id).where(User.role == UserRole.executor).where(User.executor_status == ExecutorStatus.active)
        )
    ).scalars().all()
    return list(rows)


def pick_tariff_and_apt(tariffs: dict[str, Tariff], apt_by_code: dict[str, ApartmentType], index: int) -> tuple[Tariff, ApartmentType]:
    tariff_keys = ["comfort", "basic", "optimum", "start", "premium", "comfort", "basic", "optimum", "premium", "start"]
    apt_keys = ["2room", "1room", "2room", "studio", "3room", "1room", "2room", "studio", "2room", "1room"]
    tk = tariff_keys[index % len(tariff_keys)]
    ak = apt_keys[index % len(apt_keys)]
    tr = tariffs.get(tk) or tariffs.get("basic") or next(iter(tariffs.values()))
    apt = apt_by_code.get(ak) or apt_by_code.get("2room") or next(iter(apt_by_code.values()))
    return tr, apt


async def seed_clients_and_subscriptions(session, city, tariffs, apt_by_code, now: datetime) -> list[User]:
    ph = get_password_hash(DEMO_PASSWORD)
    clients: list[User] = []
    for email, name in CLIENT_ROWS:
        r = await session.execute(select(User).where(User.email == email))
        existing = r.scalar_one_or_none()
        if existing:
            clients.append(existing)
            continue
        u = User(
            email=email,
            password_hash=ph,
            role=UserRole.client,
            name=name,
            locale="ru",
            is_active=True,
            email_verified_at=now,
            personal_data_consent_at=now,
        )
        session.add(u)
        await session.flush()
        clients.append(u)

    addresses = [
        ("Абая", "150", "42"),
        ("Достык", "89", "15"),
        ("Жандосова", "55", "8"),
        ("Тимирязева", "42к", "33"),
        ("Фурманова", "187", "21"),
        ("Байтурсынова", "98", "4"),
        ("Шевченко", "165", "102"),
        ("Гоголя", "40", "7"),
        ("Зенкова", "78", "56"),
        ("Наурызбай батыра", "128", "12"),
    ]

    # Статусы подписок по индексу: большинство active, один paused, один draft
    sub_states = ["active"] * 8 + ["paused", "draft"]

    for i, user in enumerate(clients):
        r = await session.execute(select(Subscription).where(Subscription.user_id == user.id).limit(1))
        if r.scalar_one_or_none():
            continue

        tariff, apt = pick_tariff_and_apt(tariffs, apt_by_code, i)
        street, bld, fl = addresses[i]
        state = sub_states[i]

        started = now - timedelta(days=21 + i * 3)
        ends = now + timedelta(days=300)

        sub = Subscription(
            user_id=user.id,
            tariff_id=tariff.id,
            apartment_type_id=apt.id,
            city_id=city.id,
            address_street=f"ул. {street}",
            address_building=bld,
            address_flat=fl,
            address_entrance=str((i % 5) + 1),
            address_floor=str((i % 12) + 1),
            preferred_days=[1, 3, 5] if i % 2 == 0 else [2, 4, 6],
            time_slot_start=time(10, 0),
            time_slot_end=time(14, 0),
            premium_linen=tariff.has_linen,
            premium_plants=tariff.has_plants,
            premium_ironing=tariff.has_ironing,
            status=SubscriptionStatus.active if state == "active" else SubscriptionStatus.paused if state == "paused" else SubscriptionStatus.draft,
            started_at=started if state != "draft" else None,
            ends_at=ends if state != "draft" else None,
            paused_until=(now + timedelta(days=45)) if state == "paused" else None,
            executor_id=None,
            auto_renew=True,
        )
        session.add(sub)
        await session.flush()

    return clients


async def reload_subscriptions(session, clients: list[User]) -> list[Subscription]:
    subs = []
    for u in clients:
        r = await session.execute(select(Subscription).where(Subscription.user_id == u.id))
        subs.extend(r.scalars().all())
    return subs


async def seed_visits(session, subscriptions: list[Subscription], executor_ids: list[UUID], today: date, now: datetime):
    if not executor_ids:
        return

    def ex(i: int) -> UUID:
        return executor_ids[i % len(executor_ids)]

    vi = 0
    for si, sub in enumerate(subscriptions):
        if sub.status == SubscriptionStatus.draft:
            continue

        # Набор визитов для «живости»
        batches: list[tuple[int, VisitStatus, date | None]] = []

        if si % 3 == 0:
            batches.extend(
                [
                    (-14, VisitStatus.completed, None),
                    (-7, VisitStatus.completed, None),
                    (5, VisitStatus.scheduled, None),
                    (-3, VisitStatus.cancelled, None),
                ]
            )
        elif si % 3 == 1:
            batches.extend(
                [
                    (-21, VisitStatus.completed, None),
                    (-10, VisitStatus.no_show, None),
                    (10, VisitStatus.scheduled, None),
                ]
            )
        else:
            batches.extend(
                [
                    (-30, VisitStatus.completed, None),
                    (0, VisitStatus.in_progress, None),
                    (14, VisitStatus.scheduled, None),
                ]
            )

        for offset_days, vst, _ in batches:
            d = today + timedelta(days=offset_days)
            start_t = time(10, 0)
            end_t = time(13, 30)

            visit = Visit(
                subscription_id=sub.id,
                executor_id=ex(vi) if vst != VisitStatus.cancelled else None,
                scheduled_date=d,
                time_slot_start=start_t,
                time_slot_end=end_t,
                status=vst,
                completed_at=(now - timedelta(days=abs(offset_days))) if vst == VisitStatus.completed else None,
                reschedule_count_short=1 if si % 4 == 0 else 0,
            )
            session.add(visit)
            vi += 1


async def seed_support(
    session,
    clients: list[User],
    subscriptions: list[Subscription],
    visits: list[Visit],
    support_user: User | None,
    now: datetime,
):
    """Тикеты для части клиентов; ответ поддержки если есть пользователь support."""
    # Карта первого визита по пользователю для связи ticket.visit_id
    uid_to_visit: dict[UUID, Visit | None] = {}
    for sub in subscriptions:
        if sub.status == SubscriptionStatus.draft:
            continue
        subs_visits = [v for v in visits if v.subscription_id == sub.id]
        subs_visits.sort(key=lambda x: x.scheduled_date)
        uid_to_visit[sub.user_id] = subs_visits[0] if subs_visits else None

    ticket_specs = [
        (0, "Не могу перенести визит в приложении", TicketStatus.in_progress),
        (2, "Уточнить время приезда исполнителя", TicketStatus.open),
        (4, "Запрос на дополнительную уборку кухни", TicketStatus.closed),
        (6, "Ошибка при оплате (тест)", TicketStatus.closed),
        (8, "Хочу сменить тариф на следующий месяц", TicketStatus.open),
    ]

    for idx, subject, tst in ticket_specs:
        user = clients[idx]
        r = await session.execute(
            select(SupportTicket).where(SupportTicket.user_id == user.id, SupportTicket.subject == subject)
        )
        if r.scalar_one_or_none():
            continue

        visit = uid_to_visit.get(user.id)
        ticket = SupportTicket(
            user_id=user.id,
            visit_id=visit.id if visit else None,
            subject=subject,
            status=tst,
        )
        session.add(ticket)
        await session.flush()

        session.add(
            SupportMessage(
                ticket_id=ticket.id,
                author_id=user.id,
                author_role=UserRole.client.value,
                body="Здравствуйте! " + subject.lower() + " Подскажите, пожалуйста.",
            )
        )
        if support_user:
            reply = (
                "Добрый день! Мы передали запрос координатору. Ожидайте ответ в течение рабочего дня."
                if tst != TicketStatus.closed
                else "Спасибо за обращение, вопрос решён. Если понадобится помощь — напишите."
            )
            session.add(
                SupportMessage(
                    ticket_id=ticket.id,
                    author_id=support_user.id,
                    author_role=UserRole.support.value,
                    body=reply,
                )
            )


async def main() -> None:
    now = datetime.now(timezone.utc)
    today = now.date()

    async with async_session_maker() as session:
        if await already_seeded(session):
            print("Демо-данные уже загружены (найден demo.live01@homepilot.kz). Выход без изменений.")
            return

        city, tariffs, apt_by_code, support_user = await load_refs(session)
        if len(tariffs) < 3:
            raise RuntimeError("Недостаточно тарифов в БД.")

        await ensure_extra_executors(session, city, now)
        executor_ids = await list_executor_ids(session)

        clients = await seed_clients_and_subscriptions(session, city, tariffs, apt_by_code, now)
        await session.flush()

        subscriptions = await reload_subscriptions(session, clients)
        sub_ids = [s.id for s in subscriptions]

        await seed_visits(session, subscriptions, executor_ids, today, now)
        await session.flush()

        visits_result = await session.execute(select(Visit).where(Visit.subscription_id.in_(sub_ids)))
        visits = list(visits_result.scalars().all())

        await seed_support(session, clients, subscriptions, visits, support_user, now)

        await session.commit()

    print("Готово: созданы демо-клиенты, подписки, визиты, обращения в поддержку и доп. исполнители.")
    print(f"Пароль для всех учёток *{DEMO_TAG}*: {DEMO_PASSWORD}")
    print("Клиенты (пример): demo.live01@homepilot.kz … demo.live10@homepilot.kz")
    print("Доп. исполнители: demo.live.exec4@homepilot.kz … demo.live.exec7@homepilot.kz")


if __name__ == "__main__":
    asyncio.run(main())
