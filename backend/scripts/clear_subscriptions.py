"""Удаление подписок: всех или по email пользователя (визиты и паузы удаляются каскадно)."""
import asyncio
import sys
from pathlib import Path

# Добавляем корень backend в path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select
from app.db.session import async_session_maker
from app.models import Subscription, User


async def clear_subscriptions_for_email(email: str) -> None:
    async with async_session_maker() as session:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if not user:
            print(f"Пользователь с email {email!r} не найден.")
            return
        result = await session.execute(delete(Subscription).where(Subscription.user_id == user.id))
        count = result.rowcount
        await session.commit()
        print(f"У пользователя {email} удалено подписок: {count}. Визиты и паузы удалены каскадно.")


async def clear_all_subscriptions() -> None:
    async with async_session_maker() as session:
        result = await session.execute(delete(Subscription))
        count = result.rowcount
        await session.commit()
        print(f"Удалено подписок: {count}. Визиты и паузы удалены каскадно.")


if __name__ == "__main__":
    email = (sys.argv[1:] or [None])[0]
    if email:
        asyncio.run(clear_subscriptions_for_email(email))
    else:
        asyncio.run(clear_all_subscriptions())
