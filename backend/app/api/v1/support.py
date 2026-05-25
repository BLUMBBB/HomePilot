"""Support: тикеты и сообщения."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.models import SupportTicket, SupportMessage
from app.schemas.support import TicketCreate, MessageCreate, SupportTicketResponse, SupportMessageResponse

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/tickets", status_code=201)
async def create_ticket(
    payload: TicketCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    ticket = SupportTicket(
        user_id=current_user.id,
        visit_id=payload.visit_id,
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
    return {"ticket_id": str(ticket.id), "message": "Обращение создано"}


@router.get("/tickets", response_model=list[dict])
async def list_tickets(
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.user_id == current_user.id).order_by(SupportTicket.created_at.desc())
    )
    tickets = result.scalars().all()
    return [{"id": t.id, "subject": t.subject, "status": t.status, "created_at": t.created_at} for t in tickets]


@router.get("/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)
        .options(selectinload(SupportTicket.messages))
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Тикет не найден")
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "messages": [SupportMessageResponse.model_validate(m) for m in ticket.messages],
    }


@router.post("/tickets/{ticket_id}/messages", status_code=201)
async def add_message(
    ticket_id: UUID,
    payload: MessageCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == current_user.id,
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Тикет не найден")
    msg = SupportMessage(
        ticket_id=ticket_id,
        author_id=current_user.id,
        author_role=current_user.role.value,
        body=payload.body,
    )
    db.add(msg)
    await db.flush()
    return {"message_id": str(msg.id)}
