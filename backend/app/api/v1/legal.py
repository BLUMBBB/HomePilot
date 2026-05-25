"""Legal: оферта."""
from fastapi import APIRouter, Query

router = APIRouter(prefix="/legal", tags=["legal"])


@router.get("/offer")
async def get_offer(locale: str = Query("ru")):
    return {"content": "Текст оферты (заполняется). Locale: " + locale}
