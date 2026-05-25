"""OpenAPI / Swagger: описания, теги, кастомизация схемы."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

API_DESCRIPTION = """
## HomePilot API

Бэкенд сервиса подписок на бытовые услуги (уборка): клиенты, исполнители, визиты, оплаты, поддержка.

### Базовый путь
Все методы ниже относятся к префиксу **`/api/v1`**.

### Авторизация (Bearer JWT)
1. Выполните **`POST /api/v1/auth/login`** или **`POST /api/v1/auth/register`** (клиент) / **`POST /api/v1/auth/register-executor`** (исполнитель).
2. Скопируйте **`access_token`** из ответа.
3. Нажмите **Authorize**, в поле введите: `Bearer <ваш_токен>` (слово `Bearer` и пробел можно не писать — Swagger подставит схему).
4. Подтвердите — запросы к защищённым эндпоинтам пойдут с заголовком `Authorization`.

**Роли:** часть маршрутов доступна только `client`, `executor` или `admin` — при неверной роли вернётся **403**.

### Публичные разделы
Справочники (`cities`, `tariffs`, `apartment-types`, `legal`) и **`/auth/*`** не требуют токена (кроме операций, где явно указана авторизация).

### Webhooks
**`POST /api/v1/webhooks/payment`** вызывается платёжным провайдером, не из браузера; подпись проверяется по секрету на стороне сервера.
""".strip()

OPENAPI_TAGS: list[dict[str, str]] = [
    {
        "name": "auth",
        "description": "Регистрация, вход, refresh, Google, подтверждение email, сброс пароля.",
    },
    {
        "name": "me",
        "description": "Текущий пользователь: профиль, смена пароля.",
    },
    {
        "name": "cities",
        "description": "Справочник городов (публично).",
    },
    {
        "name": "tariffs",
        "description": "Тарифы подписки (публично).",
    },
    {
        "name": "apartment-types",
        "description": "Типы квартир (публично).",
    },
    {
        "name": "legal",
        "description": "Юридические документы (публично).",
    },
    {
        "name": "subscriptions",
        "description": "Подписки клиента: оформление, слоты, перенос визитов.",
    },
    {
        "name": "visits",
        "description": "Визиты со стороны клиента.",
    },
    {
        "name": "payments",
        "description": "Платежи и checkout (клиент).",
    },
    {
        "name": "support",
        "description": "Тикеты в поддержку (клиент).",
    },
    {
        "name": "executor",
        "description": "Расписание и выполнение визитов (роль исполнителя).",
    },
    {
        "name": "admin",
        "description": "Административная панель (роль admin).",
    },
    {
        "name": "webhooks",
        "description": "Входящие webhooks (платежи).",
    },
]

CONTACT = {
    "name": "HomePilot",
    "email": "homepilot.team.kz@gmail.com",
}

LICENSE_INFO = {"name": "Proprietary"}


def attach_custom_openapi(app: FastAPI) -> None:
    """Дополняет сгенерированную схему: логотип, описание Bearer, contact."""

    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema
        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )
        info = openapi_schema.setdefault("info", {})
        info["contact"] = CONTACT
        info["license"] = LICENSE_INFO
        info["x-logo"] = {
            "url": "/openapi-assets/logo.png",
            "altText": "HomePilot",
            "backgroundColor": "#1e3a2f",
        }

        schemes = openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})
        for key, scheme in list(schemes.items()):
            if isinstance(scheme, dict) and scheme.get("type") == "http" and scheme.get("scheme") == "bearer":
                scheme["description"] = (
                    "JWT access token. Получите через **POST /api/v1/auth/login** "
                    "или регистрацию. Вставьте только значение токена или полную строку `Bearer ...`."
                )
                scheme["bearerFormat"] = "JWT"
                break
        else:
            schemes["BearerAuth"] = {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": (
                    "Вставьте `access_token` из ответа login/register. "
                    "Swagger добавит префикс Bearer автоматически при использовании Authorize."
                ),
            }

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]


def swagger_ui_parameters() -> dict[str, bool | str]:
    return {
        "deepLinking": True,
        "displayRequestDuration": True,
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "tryItOutEnabled": True,
        "syntaxHighlight.theme": "agate",
        "persistAuthorization": True,
        "customCssUrl": "/openapi-assets/swagger-overrides.css",
    }
