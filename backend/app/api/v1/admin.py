"""Админ API: клиенты, подписки, визиты, исполнители, поддержка, платежи."""
import secrets
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import asc, desc, exists, func, or_, select
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.core.dependencies import DbSession, require_role
from app.core.exceptions import AppException, NotFoundError
from app.models import (
    ApartmentType,
    Payment,
    Subscription,
    SupportMessage,
    SupportTicket,
    Tariff,
    User,
    Visit,
)
from app.models.executor_invite import ExecutorInvite
from app.models.payment import PaymentStatus
from app.models.subscription import SubscriptionStatus
from app.models.support import TicketStatus
from app.models.user import ExecutorStatus, UserRole
from app.models.visit import VisitStatus
from app.schemas.admin import (
    AdminSubscriptionPatch,
    AdminUserPatch,
    AdminVisitPatch,
    AssignExecutorBody,
    ExecutorAdminPatch,
    SupportReplyBody,
    SupportTicketStatusPatch,
)
from app.schemas.subscription import SubscriptionResponse, cleaning_type_to_str
from app.services import subscription as sub_service
from app.services import visit as visit_service

router = APIRouter(prefix="/admin", tags=["admin"])

StaffUser = require_role("admin", "support")
AdminUser = require_role("admin")


def _sub_to_dict(sub: Subscription, *, price: int | None, tariff: Tariff | None, apt: ApartmentType | None) -> dict:
    d = SubscriptionResponse.model_validate(sub).model_dump(mode="json")
    if price is not None:
        d["price_month_kzt"] = price
    if tariff is not None:
        d["tariff_cleaning_type"] = cleaning_type_to_str(tariff.cleaning_type)
    if apt is not None:
        d["apartment_type_duration_light_min"] = apt.duration_light_min
        d["apartment_type_duration_full_min"] = apt.duration_full_min
    return d


@router.get("/stats")
async def admin_stats(
    db: DbSession,
    _: User = StaffUser,
):
    today = date.today()
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    clients = await db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.client))
    executors = await db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.executor))
    active_subs = await db.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.status == SubscriptionStatus.active)
    )
    draft_subs = await db.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.status == SubscriptionStatus.draft)
    )
    visits_today = await db.scalar(
        select(func.count()).select_from(Visit).where(Visit.scheduled_date == today)
    )
    visits_week = await db.scalar(
        select(func.count())
        .select_from(Visit)
        .where(Visit.scheduled_date >= today, Visit.scheduled_date <= today + timedelta(days=7))
    )
    visits_completed_7d = await db.scalar(
        select(func.count())
        .select_from(Visit)
        .where(Visit.status == VisitStatus.completed, Visit.completed_at.is_not(None), Visit.completed_at >= week_ago)
    )
    open_tickets = await db.scalar(
        select(func.count()).select_from(SupportTicket).where(SupportTicket.status == TicketStatus.open)
    )
    tickets_in_progress = await db.scalar(
        select(func.count()).select_from(SupportTicket).where(SupportTicket.status == TicketStatus.in_progress)
    )
    pending_payments = await db.scalar(
        select(func.count()).select_from(Payment).where(Payment.status == PaymentStatus.pending)
    )
    return {
        "clients_count": clients or 0,
        "executors_count": executors or 0,
        "active_subscriptions_count": active_subs or 0,
        "draft_subscriptions_count": draft_subs or 0,
        "visits_today_count": visits_today or 0,
        "visits_next_7_days_count": visits_week or 0,
        "visits_completed_last_7_days_count": visits_completed_7d or 0,
        "open_tickets_count": open_tickets or 0,
        "support_in_progress_count": tickets_in_progress or 0,
        "pending_payments_count": pending_payments or 0,
    }


def _user_row(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "name": u.name,
        "phone": u.phone,
        "role": u.role.value if hasattr(u.role, "value") else u.role,
        "is_active": u.is_active,
        "created_at": u.created_at,
        "email_verified_at": u.email_verified_at,
        "executor_status": u.executor_status.value if u.executor_status and hasattr(u.executor_status, "value") else u.executor_status,
    }


@router.get("/users")
async def admin_list_users(
    db: DbSession,
    _: User = StaffUser,
    role: str | None = Query(None, description="client | executor"),
    search: str | None = None,
    is_active: bool | None = Query(None, description="фильтр по активности"),
    sort: str = Query("created_desc", description="created_desc | created_asc | email_asc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters = []
    if role:
        filters.append(User.role == role)
    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(or_(User.email.ilike(term), User.name.ilike(term)))
    if is_active is not None:
        filters.append(User.is_active == is_active)

    count_q = select(func.count()).select_from(User)
    if filters:
        count_q = count_q.where(*filters)
    total = int(await db.scalar(count_q) or 0)

    q = select(User)
    if filters:
        q = q.where(*filters)
    if sort == "created_asc":
        q = q.order_by(asc(User.created_at))
    elif sort == "email_asc":
        q = q.order_by(asc(User.email))
    else:
        q = q.order_by(desc(User.created_at))
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()
    return {"items": [_user_row(u) for u in users], "total": total}


@router.get("/users/{user_id}")
async def admin_get_user(
    user_id: UUID,
    db: DbSession,
    _: User = StaffUser,
):
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise NotFoundError("Пользователь не найден")

    subs_r = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .options(selectinload(Subscription.tariff), selectinload(Subscription.apartment_type))
        .order_by(Subscription.created_at.desc())
    )
    subs = subs_r.scalars().all()
    subscriptions_out = []
    for sub in subs:
        await sub_service.ensure_active_subscription_dates(db, sub)
        sub = await sub_service.load_subscription_eager(db, sub.id)
        price = await sub_service.get_price_for_subscription(db, sub.tariff_id, sub.apartment_type_id)
        subscriptions_out.append(_sub_to_dict(sub, price=price, tariff=sub.tariff, apt=sub.apartment_type))

    visits_r = await db.execute(
        select(Visit)
        .join(Subscription, Visit.subscription_id == Subscription.id)
        .where(Subscription.user_id == user_id)
        .options(selectinload(Visit.executor))
        .order_by(Visit.scheduled_date.desc(), Visit.time_slot_start.desc())
        .limit(50)
    )
    visits = visits_r.scalars().unique().all()

    pay_r = await db.execute(
        select(Payment).where(Payment.user_id == user_id).order_by(Payment.created_at.desc()).limit(30)
    )
    payments = pay_r.scalars().all()

    tix_r = await db.execute(
        select(SupportTicket).where(SupportTicket.user_id == user_id).order_by(SupportTicket.created_at.desc()).limit(20)
    )
    tickets = tix_r.scalars().all()

    return {
        "user": {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "phone": u.phone,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
            "locale": u.locale,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "email_verified_at": u.email_verified_at,
            "executor_status": u.executor_status.value if u.executor_status and hasattr(u.executor_status, "value") else u.executor_status,
            "photo_url": u.photo_url,
        },
        "subscriptions": subscriptions_out,
        "visits": [
            {
                "id": str(v.id),
                "subscription_id": str(v.subscription_id),
                "scheduled_date": v.scheduled_date,
                "time_slot_start": v.time_slot_start,
                "time_slot_end": v.time_slot_end,
                "status": v.status.value if hasattr(v.status, "value") else v.status,
                "executor_id": str(v.executor_id) if v.executor_id else None,
                "executor_name": v.executor.name if v.executor else None,
            }
            for v in visits
        ],
        "payments": [
            {
                "id": str(p.id),
                "amount_kzt": p.amount_kzt,
                "status": p.status.value if hasattr(p.status, "value") else p.status,
                "subscription_id": str(p.subscription_id) if p.subscription_id else None,
                "created_at": p.created_at,
                "paid_at": p.paid_at,
            }
            for p in payments
        ],
        "support_tickets": [
            {"id": str(t.id), "subject": t.subject, "status": t.status.value if hasattr(t.status, "value") else t.status, "created_at": t.created_at}
            for t in tickets
        ],
    }


@router.patch("/users/{user_id}")
async def admin_patch_user(
    user_id: UUID,
    payload: AdminUserPatch,
    db: DbSession,
    current_user: User = AdminUser,
):
    if user_id == current_user.id and payload.is_active is False:
        raise AppException("Нельзя деактивировать собственную учётную запись", status_code=400)
    u = await db.get(User, user_id)
    if not u:
        raise NotFoundError("Пользователь не найден")
    data = payload.model_dump(exclude_unset=True)
    if "is_active" in data and data["is_active"] is not None:
        u.is_active = data["is_active"]
    await db.flush()
    return _user_row(u)


@router.get("/subscriptions")
async def admin_list_subscriptions(
    db: DbSession,
    _: User = StaffUser,
    status: str | None = None,
    user_id: UUID | None = None,
    tariff_id: UUID | None = None,
    created_from: date | None = None,
    created_to: date | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters = []
    if status:
        filters.append(Subscription.status == status)
    if user_id:
        filters.append(Subscription.user_id == user_id)
    if tariff_id:
        filters.append(Subscription.tariff_id == tariff_id)
    if created_from:
        filters.append(func.date(Subscription.created_at) >= created_from)
    if created_to:
        filters.append(func.date(Subscription.created_at) <= created_to)

    count_q = select(func.count()).select_from(Subscription)
    if filters:
        count_q = count_q.where(*filters)
    total = int(await db.scalar(count_q) or 0)

    q = select(Subscription).options(
        selectinload(Subscription.tariff),
        selectinload(Subscription.apartment_type),
        selectinload(Subscription.user),
        selectinload(Subscription.executor),
    )
    if filters:
        q = q.where(*filters)
    q = q.order_by(Subscription.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    subs = result.scalars().unique().all()
    out = []
    for sub in subs:
        await sub_service.ensure_active_subscription_dates(db, sub)
        sub = await sub_service.load_subscription_eager(db, sub.id, with_user=True, with_executor=True)
        price = await sub_service.get_price_for_subscription(db, sub.tariff_id, sub.apartment_type_id)
        row = _sub_to_dict(sub, price=price, tariff=sub.tariff, apt=sub.apartment_type)
        row["user_email"] = sub.user.email if sub.user else None
        row["user_name"] = sub.user.name if sub.user else None
        row["tariff_code"] = sub.tariff.code if sub.tariff else None
        row["executor_name"] = sub.executor.name if sub.executor else None
        row["created_at"] = sub.created_at
        out.append(row)
    return {"items": out, "total": total}


@router.get("/subscriptions/{subscription_id}")
async def admin_get_subscription(
    subscription_id: UUID,
    db: DbSession,
    _: User = StaffUser,
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.id == subscription_id)
        .options(
            selectinload(Subscription.tariff),
            selectinload(Subscription.apartment_type),
            selectinload(Subscription.user),
            selectinload(Subscription.executor),
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundError("Подписка не найдена")
    await sub_service.ensure_active_subscription_dates(db, sub)
    sub = await sub_service.load_subscription_eager(db, sub.id, with_user=True, with_executor=True)
    price = await sub_service.get_price_for_subscription(db, sub.tariff_id, sub.apartment_type_id)
    row = _sub_to_dict(sub, price=price, tariff=sub.tariff, apt=sub.apartment_type)
    row["user_email"] = sub.user.email if sub.user else None
    row["user_name"] = sub.user.name if sub.user else None
    row["executor_name"] = sub.executor.name if sub.executor else None
    row["tariff_code"] = sub.tariff.code if sub.tariff else None
    row["created_at"] = sub.created_at
    return row


@router.patch("/subscriptions/{subscription_id}")
async def admin_patch_subscription(
    subscription_id: UUID,
    payload: AdminSubscriptionPatch,
    db: DbSession,
    _: User = AdminUser,
):
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundError("Подписка не найдена")
    data = payload.model_dump(exclude_unset=True)
    if "executor_id" in data:
        if data["executor_id"] is not None:
            ex = await db.get(User, data["executor_id"])
            if not ex or ex.role != UserRole.executor:
                raise AppException("Указанный пользователь не является исполнителем", status_code=400)
        sub.executor_id = data["executor_id"]
    if "status" in data and data["status"] is not None:
        try:
            sub.status = SubscriptionStatus(data["status"])
        except ValueError:
            raise AppException("Некорректный статус подписки", status_code=400)
    if "auto_renew" in data and data["auto_renew"] is not None:
        sub.auto_renew = data["auto_renew"]
    if "preferred_days" in data and data["preferred_days"] is not None:
        sub.preferred_days = data["preferred_days"]
    if "time_slot_start" in data and data["time_slot_start"] is not None:
        sub.time_slot_start = data["time_slot_start"]
    if "time_slot_end" in data and data["time_slot_end"] is not None:
        sub.time_slot_end = data["time_slot_end"]
    if "paused_until" in data:
        sub.paused_until = data["paused_until"]
    await db.flush()
    await db.refresh(sub)
    tariff = await db.get(Tariff, sub.tariff_id)
    apartment_type = await db.get(ApartmentType, sub.apartment_type_id)
    owner = await db.get(User, sub.user_id)
    exec_u = await db.get(User, sub.executor_id) if sub.executor_id else None
    price = await sub_service.get_price_for_subscription(db, sub.tariff_id, sub.apartment_type_id)
    row = _sub_to_dict(sub, price=price, tariff=tariff, apt=apartment_type)
    row["created_at"] = sub.created_at
    row["tariff_code"] = tariff.code if tariff else None
    row["user_email"] = owner.email if owner else None
    row["user_name"] = owner.name if owner else None
    row["executor_name"] = exec_u.name if exec_u else None
    return row


@router.get("/visits")
async def admin_list_visits(
    db: DbSession,
    _: User = StaffUser,
    scheduled_date: date | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    executor_id: UUID | None = None,
    subscription_id: UUID | None = None,
    status: str | None = None,
    client_search: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    def _apply_visit_filters(stmt):
        s = stmt.join(Subscription, Visit.subscription_id == Subscription.id)
        if scheduled_date:
            s = s.where(Visit.scheduled_date == scheduled_date)
        if date_from:
            s = s.where(Visit.scheduled_date >= date_from)
        if date_to:
            s = s.where(Visit.scheduled_date <= date_to)
        if executor_id:
            s = s.where(Visit.executor_id == executor_id)
        if subscription_id:
            s = s.where(Visit.subscription_id == subscription_id)
        if status:
            s = s.where(Visit.status == status)
        if client_search and client_search.strip():
            term = f"%{client_search.strip()}%"
            s = s.where(
                exists(
                    select(1)
                    .select_from(User)
                    .where(User.id == Subscription.user_id, or_(User.email.ilike(term), User.name.ilike(term)))
                )
            )
        return s

    count_stmt = _apply_visit_filters(select(func.count(Visit.id)))
    total = int(await db.scalar(count_stmt) or 0)

    list_stmt = _apply_visit_filters(
        select(Visit).options(
            selectinload(Visit.executor),
            selectinload(Visit.subscription).selectinload(Subscription.user),
        )
    )
    list_stmt = list_stmt.order_by(Visit.scheduled_date.desc(), Visit.time_slot_start).offset(offset).limit(limit)
    result = await db.execute(list_stmt)
    visits = result.scalars().unique().all()
    out = []
    for v in visits:
        u = v.subscription.user if v.subscription else None
        out.append(
            {
                "id": str(v.id),
                "subscription_id": str(v.subscription_id),
                "executor_id": str(v.executor_id) if v.executor_id else None,
                "executor_name": v.executor.name if v.executor else None,
                "client_email": u.email if u else None,
                "scheduled_date": v.scheduled_date,
                "time_slot_start": v.time_slot_start,
                "time_slot_end": v.time_slot_end,
                "status": v.status.value if hasattr(v.status, "value") else v.status,
                "completed_at": v.completed_at,
            }
        )
    return {"items": out, "total": total}


@router.patch("/visits/{visit_id}")
async def admin_patch_visit(
    visit_id: UUID,
    payload: AdminVisitPatch,
    db: DbSession,
    current_user: User = AdminUser,
):
    result = await db.execute(select(Visit).where(Visit.id == visit_id).options(selectinload(Visit.subscription)))
    visit = result.scalar_one_or_none()
    if not visit:
        raise NotFoundError("Визит не найден")
    if payload.status == "cancelled":
        if visit.status not in (VisitStatus.scheduled, VisitStatus.rescheduled):
            raise AppException("Можно отменить только запланированный визит", status_code=400)
        visit.status = VisitStatus.cancelled
        await db.flush()
        return {"message": "Визит отменён", "visit_id": str(visit.id)}
    if payload.new_scheduled_date and payload.new_time_slot_start and payload.new_time_slot_end:
        uid = visit.subscription.user_id if visit.subscription else current_user.id
        await visit_service.reschedule_visit(
            db,
            visit_id,
            payload.new_scheduled_date,
            payload.new_time_slot_start,
            payload.new_time_slot_end,
            uid,
            is_short_notice=False,
            skip_owner_check=True,
        )
        return {"message": "Визит перенесён", "visit_id": str(visit_id)}
    if payload.model_dump(exclude_unset=True):
        raise AppException("Укажите status=cancelled или поля переноса даты/времени", status_code=400)
    return {"message": "Нет изменений"}


@router.post("/visits/{visit_id}/assign-executor")
async def admin_assign_executor(
    visit_id: UUID,
    payload: AssignExecutorBody,
    db: DbSession,
    _: User = AdminUser,
):
    result = await db.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise NotFoundError("Визит не найден")
    ex = await db.get(User, payload.executor_id)
    if not ex or ex.role != UserRole.executor:
        raise AppException("Пользователь не является исполнителем", status_code=400)
    visit.executor_id = payload.executor_id
    await db.flush()
    return {"message": "Исполнитель назначен", "visit_id": str(visit.id)}


@router.post("/visits/{visit_id}/unassign-executor")
async def admin_unassign_executor(
    visit_id: UUID,
    db: DbSession,
    _: User = AdminUser,
):
    result = await db.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise NotFoundError("Визит не найден")
    visit.executor_id = None
    await db.flush()
    return {"message": "Исполнитель снят", "visit_id": str(visit.id)}


@router.get("/executors")
async def admin_list_executors(
    db: DbSession,
    _: User = StaffUser,
):
    result = await db.execute(
        select(User).where(User.role == UserRole.executor).order_by(User.name.nulls_last(), User.email)
    )
    users = result.scalars().all()
    ids = [u.id for u in users]
    counts: dict = {}
    if ids:
        today = date.today()
        until = today + timedelta(days=14)
        r = await db.execute(
            select(Visit.executor_id, func.count(Visit.id))
            .where(
                Visit.executor_id.in_(ids),
                Visit.scheduled_date >= today,
                Visit.scheduled_date <= until,
                Visit.status.in_(
                    (VisitStatus.scheduled, VisitStatus.rescheduled, VisitStatus.in_progress)
                ),
            )
            .group_by(Visit.executor_id)
        )
        for eid, cnt in r.all():
            counts[eid] = cnt
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "phone": u.phone,
            "is_active": u.is_active,
            "executor_status": u.executor_status.value if u.executor_status and hasattr(u.executor_status, "value") else u.executor_status,
            "photo_url": u.photo_url,
            "visits_upcoming_14d": int(counts.get(u.id, 0)),
        }
        for u in users
    ]


@router.get("/executors/{executor_id}")
async def admin_get_executor(
    executor_id: UUID,
    db: DbSession,
    _: User = StaffUser,
):
    u = await db.get(User, executor_id)
    if not u or u.role != UserRole.executor:
        raise NotFoundError("Исполнитель не найден")
    return {
        "id": str(u.id),
        "email": u.email,
        "name": u.name,
        "phone": u.phone,
        "executor_status": u.executor_status.value if u.executor_status and hasattr(u.executor_status, "value") else u.executor_status,
        "photo_url": u.photo_url,
        "locale": u.locale,
        "is_active": u.is_active,
    }


@router.patch("/executors/{executor_id}")
async def admin_patch_executor(
    executor_id: UUID,
    payload: ExecutorAdminPatch,
    db: DbSession,
    _: User = AdminUser,
):
    u = await db.get(User, executor_id)
    if not u or u.role != UserRole.executor:
        raise NotFoundError("Исполнитель не найден")
    data = payload.model_dump(exclude_unset=True)
    if "executor_status" in data and data["executor_status"] is not None:
        try:
            u.executor_status = ExecutorStatus(data["executor_status"])
        except ValueError:
            raise AppException("executor_status: active или blocked", status_code=400)
    if "is_active" in data and data["is_active"] is not None:
        u.is_active = data["is_active"]
    await db.flush()
    return {"message": "Сохранено", "executor_id": str(u.id)}


@router.post("/executors/invite")
async def admin_create_executor_invite(
    db: DbSession,
    current_user: User = AdminUser,
):
    settings = get_settings()
    code = secrets.token_urlsafe(16)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    inv = ExecutorInvite(code=code, created_by_id=current_user.id, expires_at=expires)
    db.add(inv)
    await db.flush()
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    link = f"{base}/register-executor?code={code}"
    return {"invite_code": code, "expires_at": expires.isoformat(), "link": link}


@router.get("/executor-invites")
async def admin_list_executor_invites(
    db: DbSession,
    _: User = AdminUser,
    limit: int = Query(30, ge=1, le=100),
):
    result = await db.execute(
        select(ExecutorInvite).order_by(ExecutorInvite.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": str(inv.id),
            "code": inv.code,
            "expires_at": inv.expires_at,
            "created_at": inv.created_at,
            "used_by_id": str(inv.used_by_id) if inv.used_by_id else None,
            "used_at": inv.used_at,
        }
        for inv in rows
    ]


@router.get("/support/tickets")
async def admin_list_tickets(
    db: DbSession,
    _: User = StaffUser,
    status: str | None = None,
    search: str | None = None,
    user_id: UUID | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters = []
    if status:
        filters.append(SupportTicket.status == status)
    if user_id:
        filters.append(SupportTicket.user_id == user_id)
    if search and search.strip():
        filters.append(SupportTicket.subject.ilike(f"%{search.strip()}%"))

    count_q = select(func.count()).select_from(SupportTicket)
    if filters:
        count_q = count_q.where(*filters)
    total = int(await db.scalar(count_q) or 0)

    q = select(SupportTicket).options(selectinload(SupportTicket.user))
    if filters:
        q = q.where(*filters)
    q = q.order_by(SupportTicket.updated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    tickets = result.scalars().unique().all()
    items = [
        {
            "id": str(t.id),
            "subject": t.subject,
            "status": t.status.value if hasattr(t.status, "value") else t.status,
            "user_email": t.user.email if t.user else None,
            "user_id": str(t.user_id),
            "visit_id": str(t.visit_id) if t.visit_id else None,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
        }
        for t in tickets
    ]
    return {"items": items, "total": total}


@router.get("/support/tickets/{ticket_id}")
async def admin_get_ticket(
    ticket_id: UUID,
    db: DbSession,
    _: User = StaffUser,
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.id == ticket_id)
        .options(selectinload(SupportTicket.messages), selectinload(SupportTicket.user))
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Тикет не найден")
    messages = sorted(ticket.messages, key=lambda m: m.created_at)
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "status": ticket.status.value if hasattr(ticket.status, "value") else ticket.status,
        "user_id": str(ticket.user_id),
        "user_email": ticket.user.email if ticket.user else None,
        "visit_id": str(ticket.visit_id) if ticket.visit_id else None,
        "created_at": ticket.created_at,
        "messages": [
            {
                "id": str(m.id),
                "author_id": str(m.author_id),
                "author_role": m.author_role,
                "body": m.body,
                "created_at": m.created_at,
            }
            for m in messages
        ],
    }


@router.post("/support/tickets/{ticket_id}/messages", status_code=201)
async def admin_reply_ticket(
    ticket_id: UUID,
    payload: SupportReplyBody,
    db: DbSession,
    current_user: User = StaffUser,
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Тикет не найден")
    role_val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    msg = SupportMessage(
        ticket_id=ticket_id,
        author_id=current_user.id,
        author_role=role_val,
        body=payload.body,
    )
    db.add(msg)
    if ticket.status == TicketStatus.open:
        ticket.status = TicketStatus.in_progress
    await db.flush()
    return {"message_id": str(msg.id)}


@router.patch("/support/tickets/{ticket_id}")
async def admin_patch_ticket(
    ticket_id: UUID,
    payload: SupportTicketStatusPatch,
    db: DbSession,
    _: User = StaffUser,
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Тикет не найден")
    try:
        ticket.status = TicketStatus(payload.status)
    except ValueError:
        raise AppException("Некорректный статус тикета", status_code=400)
    await db.flush()
    return {"message": "Сохранено"}


@router.get("/payments")
async def admin_list_payments(
    db: DbSession,
    _: User = StaffUser,
    user_id: UUID | None = None,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters = []
    if user_id:
        filters.append(Payment.user_id == user_id)
    if status:
        filters.append(Payment.status == status)
    if date_from:
        filters.append(func.date(Payment.created_at) >= date_from)
    if date_to:
        filters.append(func.date(Payment.created_at) <= date_to)

    count_q = select(func.count()).select_from(Payment)
    if filters:
        count_q = count_q.where(*filters)
    total = int(await db.scalar(count_q) or 0)

    q = select(Payment).order_by(Payment.created_at.desc())
    if filters:
        q = q.where(*filters)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    rows = result.scalars().all()
    items = [
        {
            "id": str(p.id),
            "user_id": str(p.user_id),
            "subscription_id": str(p.subscription_id) if p.subscription_id else None,
            "amount_kzt": p.amount_kzt,
            "status": p.status.value if hasattr(p.status, "value") else p.status,
            "created_at": p.created_at,
            "paid_at": p.paid_at,
        }
        for p in rows
    ]
    return {"items": items, "total": total}
