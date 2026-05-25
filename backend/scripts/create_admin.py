"""Создать или обновить пользователя с ролью admin (пароль и доступ в панель /admin).

  cd backend && python scripts/create_admin.py admin@example.com 'НадёжныйПароль123'

В Docker:

  docker compose -f docker-compose.prod.yml exec backend python scripts/create_admin.py admin@example.com '...'
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import async_session_maker
from app.models import User
from app.models.user import UserRole


async def create_or_update_admin(email: str, password: str, name: str | None) -> None:
    email = email.strip().lower()
    if len(password) < 8:
        raise SystemExit("Пароль не короче 8 символов.")
    now = datetime.now(timezone.utc)
    async with async_session_maker() as session:
        r = await session.execute(select(User).where(User.email == email))
        u = r.scalar_one_or_none()
        if u:
            u.role = UserRole.admin
            u.password_hash = get_password_hash(password)
            u.is_active = True
            u.email_verified_at = now
            u.executor_status = None
            if name:
                u.name = name
        else:
            session.add(
                User(
                    email=email,
                    password_hash=get_password_hash(password),
                    role=UserRole.admin,
                    name=name or "Администратор",
                    locale="ru",
                    is_active=True,
                    email_verified_at=now,
                    executor_status=None,
                )
            )
        await session.commit()
    print(f"OK: админ {email!r} — можно входить в /admin")


def main() -> None:
    p = argparse.ArgumentParser(description="Создать или обновить администратора")
    p.add_argument("email", help="Email (логин)")
    p.add_argument("password", help="Пароль (мин. 8 символов)")
    p.add_argument("--name", default=None, help="Отображаемое имя")
    args = p.parse_args()
    asyncio.run(create_or_update_admin(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
