"""Сиды: город Алматы, типы квартир, тарифы и цены (по TARIFFS_ALMATY.md)."""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select, delete
from app.config import get_settings
from app.db.session import async_session_maker
from app.db.base import Base
from app.models import City, ApartmentType, Tariff, TariffPrice, ChecklistTemplate, ChecklistItem, User, ExecutorZone
from app.models.tariff import CleaningType
from app.models.user import UserRole, ExecutorStatus
from app.core.security import get_password_hash


async def seed_cities(session) -> None:
    r = await session.execute(select(City).where(City.code == "almaty"))
    if r.scalar_one_or_none():
        return
    session.add(City(
        code="almaty",
        name_ru="Алматы",
        name_kk="Алматы",
        is_active=True,
    ))
    await session.flush()


async def seed_apartment_types(session) -> None:
    codes = ["studio", "1room", "2room", "3room"]
    names_ru = ["Студия", "1-комнатная", "2-комнатная", "3-комнатная"]
    names_kk = ["Студия", "1 бөлмелі", "2 бөлмелі", "3 бөлмелі"]
    # Нормы времени: лёгкая/полная (мин): студия 60/120, 1ком 75/150, 2ком 90/180, 3ком 120/240
    duration_light = [60, 75, 90, 120]
    duration_full = [120, 150, 180, 240]
    for code, nr, nk, dl, df in zip(codes, names_ru, names_kk, duration_light, duration_full):
        r = await session.execute(select(ApartmentType).where(ApartmentType.code == code))
        if r.scalar_one_or_none():
            continue
        session.add(ApartmentType(
            code=code, name_ru=nr, name_kk=nk,
            duration_light_min=dl, duration_full_min=df,
        ))
    await session.flush()


async def seed_tariffs_and_prices(session) -> None:
    # Тарифы: start, basic, optimum, comfort, premium
    tariffs_data = [
        ("start", "Старт", "Старт", CleaningType.light, 4, False, False, False, 1),
        ("basic", "Базовый", "Негізгі", CleaningType.full, 4, False, False, False, 2),
        ("optimum", "Оптимум", "Оптимум", CleaningType.light, 8, False, False, False, 3),
        ("comfort", "Комфорт", "Комфорт", CleaningType.full, 8, False, False, False, 4),
        ("premium", "Премиум", "Премиум", CleaningType.full, 8, True, True, True, 5),
    ]
    # Базовые цены (ваша сетка): 1-комн, 2-комн, 3-комн, Студия — увеличены в 3 раза.
    # Порядок в БД: order_by(code) → 1room, 2room, 3room, studio
    price_matrix = {
        "start": (72000, 84000, 102000, 132000),     # лёгкая 4 визита: 24/28/34/44 ×3
        "optimum": (132000, 156000, 192000, 252000), # лёгкая 8 визитов: 44/52/64/84 ×3
        "basic": (96000, 120000, 144000, 192000),    # полная 4 визита: 32/40/48/64 ×3
        "comfort": (180000, 228000, 276000, 360000), # полная 8 визитов: 60/76/92/120 ×3
        "premium": (216000, 273600, 331200, 432000), # комфорт +20%
    }
    apt_types = (await session.execute(select(ApartmentType).order_by(ApartmentType.code))).scalars().all()
    apt_order = [t.code for t in apt_types]  # 1room, 2room, 3room, studio
    for code, name_ru, name_kk, cleaning_type, visits, linen, plants, ironing, sort_order in tariffs_data:
        r = await session.execute(select(Tariff).where(Tariff.code == code))
        t = r.scalar_one_or_none()
        if not t:
            t = Tariff(
                code=code, name_ru=name_ru, name_kk=name_kk,
                cleaning_type=cleaning_type, visits_per_month=visits,
                has_linen=linen, has_plants=plants, has_ironing=ironing,
                is_active=True, sort_order=sort_order,
            )
            session.add(t)
            await session.flush()
        # Обновляем цены (для существующих тарифов — перезаписываем)
        await session.execute(delete(TariffPrice).where(TariffPrice.tariff_id == t.id))
        prices = price_matrix[code]
        for apt, price in zip(apt_types, prices):
            session.add(TariffPrice(
                tariff_id=t.id,
                apartment_type_id=apt.id,
                price_month_kzt=price,
            ))
    await session.flush()


async def seed_checklist_templates(session) -> None:
    """Чек-листы для лёгкой и полной уборки (общие шаблоны, apartment_type_id=null)."""
    for ct in [CleaningType.light, CleaningType.full]:
        r = await session.execute(
            select(ChecklistTemplate).where(
                ChecklistTemplate.cleaning_type == ct,
                ChecklistTemplate.apartment_type_id.is_(None),
            )
        )
        if r.scalar_one_or_none():
            continue
        t = ChecklistTemplate(cleaning_type=ct, apartment_type_id=None, sort_order=0)
        session.add(t)
        await session.flush()
        items_light = [
            ("Подмести полы", "Еденін тазалау"),
            ("Протереть пыль", "Шаңды сүрту"),
            ("Вынести мусор", "Қоқысты шығару"),
            ("Вымыть раковину на кухне", "Асханадағы ыдысжуғышты жылу"),
        ]
        items_full = [
            ("Подмести и помыть полы", "Еденді тазалау және жылу"),
            ("Протереть пыль", "Шаңды сүрту"),
            ("Вынести мусор", "Қоқысты шығару"),
            ("Вымыть раковину на кухне", "Асханадағы ыдысжуғышты жылу"),
            ("Вымыть санузел", "Жуынатын бөлмені жылу"),
            ("Протереть кухонные поверхности", "Асхана беттерін сүрту"),
            ("Разложить вещи (по желанию)", "Заттарды жинақтау (қалауыңыз бойынша)"),
        ]
        items = items_light if ct == CleaningType.light else items_full
        for i, (title_ru, title_kk) in enumerate(items):
            session.add(ChecklistItem(
                template_id=t.id,
                title_ru=title_ru,
                title_kk=title_kk,
                sort_order=i,
            ))
    await session.flush()


# Тестовые исполнители (email / пароль для входа)
EXECUTOR_CREDENTIALS = [
    ("executor1@homepilot.kz", "executor123", "Айгуль Сарсенова"),
    ("executor2@homepilot.kz", "executor123", "Мадина Оспанова"),
    ("executor3@homepilot.kz", "executor123", "Динара Касымова"),
]


async def seed_executors(session) -> None:
    """Создаёт 3 тестовых исполнителя, если их ещё нет."""
    now = datetime.now(timezone.utc)
    for email, password, name in EXECUTOR_CREDENTIALS:
        r = await session.execute(select(User).where(User.email == email))
        if r.scalar_one_or_none():
            continue
        session.add(User(
            email=email,
            password_hash=get_password_hash(password),
            role=UserRole.executor,
            name=name,
            executor_status=ExecutorStatus.active,
            email_verified_at=now,
        ))
    await session.flush()


async def seed_staff_users(session) -> None:
    """Админ и поддержка для панели /admin (только если записи с таким email ещё нет)."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    rows = [
        (settings.SEED_ADMIN_EMAIL, settings.SEED_ADMIN_PASSWORD, UserRole.admin, "Администратор"),
        (settings.SEED_SUPPORT_EMAIL, settings.SEED_SUPPORT_PASSWORD, UserRole.support, "Поддержка"),
    ]
    for email, password, role, name in rows:
        r = await session.execute(select(User).where(User.email == email))
        if r.scalar_one_or_none():
            continue
        session.add(
            User(
                email=email,
                password_hash=get_password_hash(password),
                role=role,
                name=name,
                locale="ru",
                is_active=True,
                email_verified_at=now,
                executor_status=None,
            )
        )
    await session.flush()


async def seed_executor_zones(session) -> None:
    """Привязывает исполнителей к городу Алматы для автоназначения визитов."""
    city = (await session.execute(select(City).where(City.code == "almaty"))).scalar_one_or_none()
    if not city:
        return
    executors = (
        await session.execute(
            select(User).where(User.role == UserRole.executor).where(User.executor_status == ExecutorStatus.active)
        )
    ).scalars().all()
    for u in executors:
        r = await session.execute(
            select(ExecutorZone).where(ExecutorZone.executor_id == u.id, ExecutorZone.city_id == city.id)
        )
        if r.scalar_one_or_none():
            continue
        session.add(ExecutorZone(
            executor_id=u.id,
            city_id=city.id,
            zone_name="Алматы (центр)",
        ))
    await session.flush()


async def run_seed() -> None:
    async with async_session_maker() as session:
        await seed_cities(session)
        await seed_apartment_types(session)
        await seed_tariffs_and_prices(session)
        await seed_checklist_templates(session)
        await seed_executors(session)
        await seed_staff_users(session)
        await seed_executor_zones(session)
        await session.commit()
    print("Seed completed.")
    settings = get_settings()
    print(f"\nАдмин-панель: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
    print(f"Поддержка: {settings.SEED_SUPPORT_EMAIL} / {settings.SEED_SUPPORT_PASSWORD}")
    print("\nТестовые исполнители:")
    for email, password, name in EXECUTOR_CREDENTIALS:
        print(f"  {email} / {password} ({name})")


if __name__ == "__main__":
    asyncio.run(run_seed())
