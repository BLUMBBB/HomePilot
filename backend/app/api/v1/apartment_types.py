"""Apartment types: список типов квартир."""
from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DbSession
from app.models import ApartmentType

router = APIRouter(prefix="/apartment-types", tags=["apartment-types"])


@router.get("", response_model=list[dict])
async def list_apartment_types(
    locale: str = Query("ru", description="ru | kk"),
    db: DbSession = None,
):
    result = await db.execute(
        select(ApartmentType).order_by(ApartmentType.code)
    )
    types = result.scalars().all()
    name_attr = "name_kk" if locale == "kk" else "name_ru"
    return [
        {
            "id": t.id,
            "code": t.code,
            "name": getattr(t, name_attr),
            "duration_light_min": t.duration_light_min,
            "duration_full_min": t.duration_full_min,
        }
        for t in types
    ]
