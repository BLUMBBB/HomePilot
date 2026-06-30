"""Visits: список визитов клиента, детали, перенос, жалоба, фото."""
from datetime import date
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import VisitNotFoundError
from app.models import Visit, VisitChecklistResult, Subscription, SupportTicket, SupportMessage
from app.models.user import UserRole
from app.schemas.visit import VisitRescheduleRequest, VisitComplaintRequest
from app.services import visit as visit_service

router = APIRouter(prefix="/visits", tags=["visits"])


@router.get("", response_model=list[dict])
async def list_visits(
    current_user: CurrentUser,
    db: DbSession,
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    status: str | None = Query(None),
):
    q = (
        select(Visit)
        .join(Subscription, Visit.subscription_id == Subscription.id)
        .where(Subscription.user_id == current_user.id)
        .options(selectinload(Visit.subscription), selectinload(Visit.executor))
    )
    if from_date:
        q = q.where(Visit.scheduled_date >= from_date)
    if to_date:
        q = q.where(Visit.scheduled_date <= to_date)
    if status:
        q = q.where(Visit.status == status)
    q = q.order_by(Visit.scheduled_date, Visit.time_slot_start)
    result = await db.execute(q)
    visits = result.scalars().unique().all()
    return [
        {
            "id": v.id,
            "subscription_id": v.subscription_id,
            "executor_id": v.executor_id,
            "scheduled_date": v.scheduled_date,
            "time_slot_start": v.time_slot_start,
            "time_slot_end": v.time_slot_end,
            "status": v.status.value if hasattr(v.status, "value") else v.status,
            "completed_at": v.completed_at,
            "executor": {"name": v.executor.name, "photo_url": v.executor.photo_url} if v.executor else None,
        }
        for v in visits
    ]


@router.get("/{visit_id}/photos/{filename:path}")
async def get_visit_photo(
    visit_id: UUID,
    filename: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Отдать фото визита (клиент или исполнитель)."""
    result = await db.execute(
        select(Visit)
        .join(Subscription, Visit.subscription_id == Subscription.id)
        .where(Visit.id == visit_id)
        .where(
            (Subscription.user_id == current_user.id) | (Visit.executor_id == current_user.id)
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    if ".." in filename or "/" in filename:
        raise VisitNotFoundError()
    settings = get_settings()
    file_path = Path(settings.UPLOAD_DIR) / "visits" / str(visit_id) / filename
    if not file_path.is_file():
        raise VisitNotFoundError()
    lower = filename.lower()
    if lower.endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"
    elif lower.endswith(".png"):
        media_type = "image/png"
    else:
        media_type = "image/webp"
    return FileResponse(path=str(file_path), filename=filename, media_type=media_type)


@router.get("/{visit_id}")
async def get_visit(
    visit_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Visit)
        .join(Subscription, Visit.subscription_id == Subscription.id)
        .where(Visit.id == visit_id, Subscription.user_id == current_user.id)
        .options(
            selectinload(Visit.photos),
            selectinload(Visit.checklist_results).joinedload(VisitChecklistResult.checklist_item),
            selectinload(Visit.executor),
            selectinload(Visit.subscription),
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    return {
        "id": visit.id,
        "subscription_id": visit.subscription_id,
        "executor": {"name": visit.executor.name, "photo_url": visit.executor.photo_url} if visit.executor else None,
        "scheduled_date": visit.scheduled_date,
        "time_slot_start": visit.time_slot_start,
        "time_slot_end": visit.time_slot_end,
        "status": visit.status.value if hasattr(visit.status, "value") else visit.status,
        "completed_at": visit.completed_at,
        "photos": [{"id": str(p.id), "file_path": p.file_path} for p in visit.photos],
        "checklist_results": [
            {
                "checklist_item_id": str(r.checklist_item_id),
                "done": r.done,
                "title_ru": r.checklist_item.title_ru if r.checklist_item else None,
                "title_kk": r.checklist_item.title_kk if r.checklist_item else None,
            }
            for r in visit.checklist_results
        ],
    }


@router.post("/{visit_id}/reschedule")
async def reschedule_visit(
    visit_id: UUID,
    payload: VisitRescheduleRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    visit = await visit_service.reschedule_visit(
        db,
        visit_id,
        payload.new_scheduled_date,
        payload.new_time_slot_start,
        payload.new_time_slot_end,
        current_user.id,
        is_short_notice=False,
    )
    return {"message": "Визит перенесён", "visit_id": str(visit.id)}


@router.post("/{visit_id}/complaint")
async def create_complaint(
    visit_id: UUID,
    payload: VisitComplaintRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Visit)
        .join(Subscription, Visit.subscription_id == Subscription.id)
        .where(Visit.id == visit_id, Subscription.user_id == current_user.id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise VisitNotFoundError()
    ticket = SupportTicket(
        user_id=current_user.id,
        visit_id=visit_id,
        subject=payload.subject,
        status="open",
    )
    db.add(ticket)
    await db.flush()
    msg = SupportMessage(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_role=current_user.role.value,
        body=payload.message,
    )
    db.add(msg)
    await db.flush()
    return {"message": "Обращение создано", "ticket_id": str(ticket.id)}
