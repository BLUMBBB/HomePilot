"""Executor: визиты, старт, завершение, no-show, загрузка фото."""
from datetime import date, datetime, time, timedelta
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import VisitNotFoundError, ForbiddenError
from app.models import Visit, VisitPhoto, VisitChecklistResult, Subscription, ChecklistTemplate, ChecklistItem
from app.models.user import UserRole
from app.models.visit import VisitStatus
from app.schemas.visit import VisitCompleteRequest
from app.services import visit as visit_service
from app.services import storage as storage_service

router = APIRouter(prefix="/executor", tags=["executor"])


def _executor_only(current_user: CurrentUser):
    if current_user.role != UserRole.executor:
        raise ForbiddenError("Доступ только для исполнителя")
    return current_user


def _cleaning_type_raw(tariff) -> str:
    if not tariff or tariff.cleaning_type is None:
        return "full"
    ct = tariff.cleaning_type
    return ct.value if hasattr(ct, "value") else str(ct)


def _cleaning_human(ct_raw: str) -> str:
    return "Лёгкая уборка" if str(ct_raw).lower() == "light" else "Полная уборка"


def _slot_duration_minutes(t0: time, t1: time) -> int:
    a = datetime.combine(date(2000, 1, 1), t0)
    b = datetime.combine(date(2000, 1, 1), t1)
    if b <= a:
        b += timedelta(days=1)
    return max(0, int((b - a).total_seconds() // 60))


def _full_address_line(sub: Subscription | None, city_name: str | None) -> str | None:
    if not sub:
        return None
    parts = [city_name, sub.address_street, sub.address_building, sub.address_flat]
    parts = [p for p in parts if p]
    return ", ".join(parts) if parts else None


def _maps_url(sub: Subscription | None, city_name: str | None) -> str | None:
    line = _full_address_line(sub, city_name)
    if not line:
        return None
    return "https://yandex.ru/maps/?text=" + quote(line)


def _serialize_executor_visit(v: Visit) -> dict:
    sub = v.subscription
    city_name = sub.city.name_ru if sub and sub.city else None
    apt_name = sub.apartment_type.name_ru if sub and sub.apartment_type else None
    ct_raw = _cleaning_type_raw(sub.tariff if sub else None)
    user = sub.user if sub else None
    client_name = (user.name or "").strip() if user else None
    client_phone = user.phone if user else None
    line = _full_address_line(sub, city_name)
    maps = _maps_url(sub, city_name)
    duration = _slot_duration_minutes(v.time_slot_start, v.time_slot_end)
    return {
        "id": v.id,
        "scheduled_date": v.scheduled_date,
        "time_slot_start": v.time_slot_start,
        "time_slot_end": v.time_slot_end,
        "status": v.status.value if hasattr(v.status, "value") else v.status,
        "address": line,
        "client_phone": client_phone,
        "client_name": client_name or None,
        "city_name": city_name,
        "apartment_type_name": apt_name,
        "cleaning_type": ct_raw,
        "cleaning_type_label": _cleaning_human(ct_raw),
        "duration_minutes": duration,
        "maps_url": maps,
        "address_entrance": sub.address_entrance if sub else None,
        "address_floor": sub.address_floor if sub else None,
        "address_doorcode": sub.address_doorcode if sub else None,
        "premium_linen": bool(sub.premium_linen) if sub else False,
        "premium_plants": bool(sub.premium_plants) if sub else False,
        "premium_ironing": bool(sub.premium_ironing) if sub else False,
    }


@router.get("/visits", response_model=list[dict])
async def list_executor_visits(
    current_user: CurrentUser,
    db: DbSession,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: str | None = Query(
        None,
        description="Фильтр статусов через запятую: scheduled,in_progress,completed,...",
    ),
):
    _executor_only(current_user)
    if not date_from:
        date_from = date.today()
    if not date_to:
        date_to = date_from + timedelta(days=7)

    q = (
        select(Visit)
        .where(
            Visit.executor_id == current_user.id,
            Visit.scheduled_date >= date_from,
            Visit.scheduled_date <= date_to,
        )
        .options(
            selectinload(Visit.subscription).selectinload(Subscription.user),
            selectinload(Visit.subscription).selectinload(Subscription.city),
            selectinload(Visit.subscription).selectinload(Subscription.apartment_type),
            selectinload(Visit.subscription).selectinload(Subscription.tariff),
        )
        .order_by(Visit.scheduled_date, Visit.time_slot_start)
    )

    if status and status.strip():
        parts = [s.strip() for s in status.split(",") if s.strip()]
        allowed: list[VisitStatus] = []
        for p in parts:
            try:
                allowed.append(VisitStatus(p))
            except ValueError:
                continue
        if allowed:
            q = q.where(Visit.status.in_(allowed))

    result = await db.execute(q)
    visits = result.scalars().all()
    return [_serialize_executor_visit(v) for v in visits]


@router.get("/visits/{visit_id}")
async def get_executor_visit(
    visit_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    _executor_only(current_user)
    result = await db.execute(
        select(Visit)
        .where(Visit.id == visit_id, Visit.executor_id == current_user.id)
        .options(
            selectinload(Visit.subscription).selectinload(Subscription.user),
            selectinload(Visit.subscription).selectinload(Subscription.city),
            selectinload(Visit.subscription).selectinload(Subscription.apartment_type),
            selectinload(Visit.subscription).selectinload(Subscription.tariff),
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    sub = visit.subscription
    cleaning_type = _cleaning_type_raw(sub.tariff if sub else None)
    apartment_type_id = sub.apartment_type_id if sub else None
    city_name = sub.city.name_ru if sub and sub.city else None
    client_name = (sub.user.name or "").strip() if sub and sub.user else None
    maps = _maps_url(sub, city_name)

    template_res = await db.execute(
        select(ChecklistTemplate)
        .where(ChecklistTemplate.cleaning_type == cleaning_type)
        .where(or_(ChecklistTemplate.apartment_type_id == apartment_type_id, ChecklistTemplate.apartment_type_id.is_(None)))
        .order_by(ChecklistTemplate.apartment_type_id.desc().nulls_last())
        .limit(1)
    )
    template = template_res.scalar_one_or_none()
    checklist_items = []
    if template:
        items_res = await db.execute(
            select(ChecklistItem).where(ChecklistItem.template_id == template.id).order_by(ChecklistItem.sort_order)
        )
        checklist_items = [
            {"id": str(i.id), "title_ru": i.title_ru, "title_kk": i.title_kk, "sort_order": i.sort_order}
            for i in items_res.scalars().all()
        ]

    return {
        "id": visit.id,
        "scheduled_date": visit.scheduled_date,
        "time_slot_start": visit.time_slot_start,
        "time_slot_end": visit.time_slot_end,
        "status": visit.status.value if hasattr(visit.status, "value") else visit.status,
        "address_street": sub.address_street,
        "address_building": sub.address_building,
        "address_flat": sub.address_flat,
        "address_entrance": sub.address_entrance,
        "address_floor": sub.address_floor,
        "address_doorcode": sub.address_doorcode,
        "address_comment": sub.address_comment,
        "city_name": city_name,
        "maps_url": maps,
        "client_name": client_name or None,
        "client_phone": sub.user.phone if sub and sub.user else None,
        "cleaning_type": cleaning_type,
        "cleaning_type_label": _cleaning_human(cleaning_type),
        "duration_minutes": _slot_duration_minutes(visit.time_slot_start, visit.time_slot_end),
        "apartment_type": sub.apartment_type.code if sub.apartment_type else None,
        "apartment_type_name": sub.apartment_type.name_ru if sub.apartment_type else None,
        "premium_linen": bool(sub.premium_linen) if sub else False,
        "premium_plants": bool(sub.premium_plants) if sub else False,
        "premium_ironing": bool(sub.premium_ironing) if sub else False,
        "checklist_items": checklist_items,
    }


@router.post("/visits/{visit_id}/start")
async def start_visit(
    visit_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    _executor_only(current_user)
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id, Visit.executor_id == current_user.id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    visit.status = VisitStatus.in_progress
    await db.flush()
    return {"message": "Визит начат"}


@router.post("/visits/{visit_id}/complete")
async def complete_visit(
    visit_id: UUID,
    payload: VisitCompleteRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    _executor_only(current_user)
    results = [{"checklist_item_id": r.checklist_item_id, "done": r.done, "photo_id": r.photo_id} for r in payload.results]
    await visit_service.complete_visit(db, visit_id, current_user.id, results)
    return {"message": "Визит завершён"}


@router.post("/visits/{visit_id}/upload-photo")
async def upload_visit_photo(
    visit_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
    checklist_item_id: UUID | None = Form(None),
):
    _executor_only(current_user)
    result = await db.execute(
        select(Visit).where(Visit.id == visit_id, Visit.executor_id == current_user.id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    rel_path, file_size, content_type = await storage_service.save_visit_photo(
        visit_id, file, checklist_item_id
    )
    photo = VisitPhoto(
        visit_id=visit_id,
        checklist_item_id=checklist_item_id,
        file_path=rel_path,
        file_size=file_size,
        content_type=content_type,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return {"id": str(photo.id), "file_path": photo.file_path}


@router.post("/visits/{visit_id}/no-show")
async def no_show_visit(
    visit_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    _executor_only(current_user)
    await visit_service.no_show_visit(db, visit_id, current_user.id)
    return {"message": "Отмечена неявка"}
