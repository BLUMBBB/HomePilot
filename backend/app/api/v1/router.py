"""Объединение всех роутеров API v1."""
from fastapi import APIRouter

from app.api.v1 import admin
from app.api.v1 import auth, cities, tariffs, apartment_types, users
from app.api.v1 import subscriptions, visits, payments, support
from app.api.v1 import legal
from app.api.v1.executor import visits as executor_visits
from app.api.v1.webhooks import payment as webhook_payment

api_v1_router = APIRouter()

# Публичные
api_v1_router.include_router(auth.router)
api_v1_router.include_router(cities.router)
api_v1_router.include_router(tariffs.router)
api_v1_router.include_router(apartment_types.router)
api_v1_router.include_router(legal.router)

# Требуют авторизации
api_v1_router.include_router(users.router)
api_v1_router.include_router(admin.router)
api_v1_router.include_router(subscriptions.router)
api_v1_router.include_router(visits.router)
api_v1_router.include_router(payments.router)
api_v1_router.include_router(support.router)

# Исполнитель
api_v1_router.include_router(executor_visits.router)

# Webhooks (без авторизации по токену)
api_v1_router.include_router(webhook_payment.router)
