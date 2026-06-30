"""Cities: список активных городов."""
from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DbSession
from app.models import City
from app.schemas.city import CityResponse

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[dict])
async def list_cities(
    locale: str = Query("ru", description="ru | kk"),
    db: DbSession = None,
):
    result = await db.execute(
        select(City).where(City.is_active == True).order_by(City.code)
    )
    cities = result.scalars().all()
    name_attr = "name_ru" if locale == "kk" else "name_ru"
    if locale == "kk":
        name_attr = "name_kk"
    return [
        {"id": c.id, "code": c.code, "name": getattr(c, name_attr)}
        for c in cities
    ]
