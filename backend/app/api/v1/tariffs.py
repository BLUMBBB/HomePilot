"""Tariffs: список тарифов с ценами по типам квартир."""
from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DbSession
from app.models import Tariff, TariffPrice, ApartmentType
from app.schemas.tariff import TariffResponse, TariffPriceSchema

router = APIRouter(prefix="/tariffs", tags=["tariffs"])


@router.get("", response_model=list[dict])
async def list_tariffs(
    locale: str = Query("ru", description="ru | kk"),
    db: DbSession = None,
):
    result = await db.execute(
        select(Tariff)
        .where(Tariff.is_active == True)
        .options(selectinload(Tariff.prices).selectinload(TariffPrice.apartment_type))
        .order_by(Tariff.sort_order, Tariff.code)
    )
    tariffs = result.scalars().unique().all()
    name_attr = "name_kk" if locale == "kk" else "name_ru"
    out = []
    for t in tariffs:
        prices = [
            {
                "apartment_type_id": p.apartment_type_id,
                "apartment_type_code": p.apartment_type.code if p.apartment_type else None,
                "price_month_kzt": p.price_month_kzt,
            }
            for p in t.prices
        ]
        out.append({
            "id": t.id,
            "code": t.code,
            "name": getattr(t, name_attr),
            "cleaning_type": t.cleaning_type.value,
            "visits_per_month": t.visits_per_month,
            "has_linen": t.has_linen,
            "has_plants": t.has_plants,
            "has_ironing": t.has_ironing,
            "is_active": t.is_active,
            "sort_order": t.sort_order,
            "prices": prices,
        })
    return out
