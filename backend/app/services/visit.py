"""Visit service: reschedule, complete, no_show, assign_executor."""
from datetime import datetime, timezone, time

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import VisitNotFoundError, ForbiddenError, VisitNotReschedulableError, AppException
from app.models import Visit, VisitPhoto, VisitChecklistResult, User, ExecutorZone, Subscription
from app.models.user import UserRole, ExecutorStatus
from app.models.visit import VisitStatus


async def assign_executor(db: AsyncSession, visit: Visit, city_id) -> None:
    """
    Назначает исполнителя визиту по критериям:
    - Зоны (executor_zones): город совпадает с подпиской
    - Загрузка: выбирает исполнителя с наименьшим числом визитов на дату
    - Статус: только executor_status = active
    Если executor уже назначен — не перезаписываем.
    """
    if visit.executor_id is not None:
        return

    # Кандидаты: активные исполнители с зоной в этом городе
    subq = (
        select(ExecutorZone.executor_id)
        .where(ExecutorZone.city_id == city_id)
        .distinct()
    )
    candidates_with_zones = (
        select(User.id)
        .where(User.role == UserRole.executor)
        .where(User.executor_status == ExecutorStatus.active)
        .where(User.is_active == True)
        .where(User.id.in_(subq))
    )
    result = await db.execute(candidates_with_zones)
    candidate_ids = [r[0] for r in result.all()]

    # Fallback: если ни у кого нет зон — берём всех активных исполнителей
    if not candidate_ids:
        fallback = (
            select(User.id)
            .where(User.role == UserRole.executor)
            .where(User.executor_status == ExecutorStatus.active)
            .where(User.is_active == True)
        )
        r2 = await db.execute(fallback)
        candidate_ids = [r[0] for r in r2.all()]

    if not candidate_ids:
        return

    # Считаем визиты на дату у каждого кандидата (scheduled, in_progress, rescheduled)
    best_executor_id = None
    min_visits = float("inf")
    visit_date = visit.scheduled_date

    for eid in candidate_ids:
        cnt_res = await db.execute(
            select(func.count(Visit.id)).where(
                Visit.executor_id == eid,
                Visit.scheduled_date == visit_date,
                Visit.status.in_((VisitStatus.scheduled, VisitStatus.in_progress, VisitStatus.rescheduled)),
            )
        )
        cnt = cnt_res.scalar() or 0
        if cnt < min_visits:
            min_visits = cnt
            best_executor_id = eid

    if best_executor_id is not None:
        visit.executor_id = best_executor_id
        await db.flush()


WORKING_HOURS_START = time(8, 0)
WORKING_HOURS_END = time(18, 0)


async def reschedule_visit(
    db: AsyncSession,
    visit_id,
    new_date,
    new_time_start,
    new_time_end,
    user_id,
    is_short_notice: bool = False,
) -> Visit:
    result = await db.execute(
        select(Visit)
        .options(
            selectinload(Visit.subscription).selectinload(Subscription.tariff),
            selectinload(Visit.subscription).selectinload(Subscription.apartment_type),
        )
        .where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    if visit.subscription.user_id != user_id:
        raise ForbiddenError("Нет доступа к визиту")
    if visit.status not in (VisitStatus.scheduled, VisitStatus.rescheduled):
        raise VisitNotReschedulableError("Визит нельзя перенести")

    sub = visit.subscription
    # Проверка: дата в периоде подписки
    if sub.started_at or sub.ends_at:
        sub_start = sub.started_at.date() if sub.started_at else None
        sub_end = sub.ends_at.date() if sub.ends_at else None
        if sub_start and new_date < sub_start:
            raise AppException("Дата визита должна быть не ранее начала действия подписки", status_code=400)
        if sub_end and new_date > sub_end:
            raise AppException("Дата визита должна быть не позже окончания подписки", status_code=400)

    # Проверка: рабочие часы 8:00–18:00
    start_t = new_time_start if isinstance(new_time_start, time) else time.fromisoformat(str(new_time_start)[:8])
    end_t = new_time_end if isinstance(new_time_end, time) else time.fromisoformat(str(new_time_end)[:8])
    if start_t < WORKING_HOURS_START or end_t > WORKING_HOURS_END:
        raise AppException("Слот должен быть в рабочее время (8:00–18:00)", status_code=400)
    if start_t >= end_t:
        raise AppException("Время окончания должно быть позже начала", status_code=400)

    # Проверка: длительность слота по тарифу и типу квартиры
    if sub.tariff and sub.apartment_type:
        cleaning = sub.tariff.cleaning_type
        duration_min = (
            sub.apartment_type.duration_light_min
            if cleaning and str(cleaning).lower() == "light"
            else sub.apartment_type.duration_full_min
        )
        slot_minutes = (end_t.hour * 60 + end_t.minute) - (start_t.hour * 60 + start_t.minute)
        if slot_minutes > duration_min:
            raise AppException(
                f"Длительность слота не должна превышать {duration_min // 60} ч. по вашему тарифу",
                status_code=400,
            )

    if is_short_notice:
        visit.reschedule_count_short = (visit.reschedule_count_short or 0) + 1
    visit.scheduled_date = new_date
    visit.time_slot_start = new_time_start
    visit.time_slot_end = new_time_end
    visit.status = VisitStatus.scheduled
    await db.flush()
    await db.refresh(visit)
    return visit


async def complete_visit(
    db: AsyncSession,
    visit_id,
    executor_id,
    results: list,
    photos: list | None = None,
) -> Visit:
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    if str(visit.executor_id) != str(executor_id):
        raise ForbiddenError("Визит назначен другому исполнителю")
    for item in results:
        r = VisitChecklistResult(
            visit_id=visit_id,
            checklist_item_id=item["checklist_item_id"],
            done=item["done"],
            photo_id=item.get("photo_id"),
        )
        db.add(r)
    visit.status = VisitStatus.completed
    visit.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(visit)
    return visit


async def no_show_visit(db: AsyncSession, visit_id, executor_id) -> Visit:
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    if str(visit.executor_id) != str(executor_id):
        raise ForbiddenError("Визит назначен другому исполнителю")
    visit.status = VisitStatus.no_show
    await db.flush()
    await db.refresh(visit)
    return visit
