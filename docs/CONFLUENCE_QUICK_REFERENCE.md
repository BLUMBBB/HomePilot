# HomePilot — Краткая справка (Quick Reference)

Страница для быстрого доступа к командам и ссылкам. Рекомендуется разместить в Confluence как отдельную дочернюю страницу к основной документации проекта.

---

## Команды запуска

| Действие | Команда |
|----------|---------|
| Запуск БД + бэкенд (Docker) | `cd backend && docker compose up --build` |
| Запуск в фоне | `cd backend && docker compose up -d` |
| Логи бэкенда | `docker compose logs -f backend` |
| Остановка | `docker compose down` |
| Бэкенд локально | `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8001` |
| Миграции | `cd backend && alembic upgrade head` |
| Сиды (справочники) | `cd backend && python -m app.db.seed` |
| Фронтенд | `cd frontend && npm run dev` |
| Очистка подписок | `cd backend && python scripts/clear_subscriptions.py` |

---

## Полезные URL (локальная разработка)

| Сервис | URL |
|--------|-----|
| API | http://localhost:8001 |
| Swagger (документация API) | http://localhost:8001/docs |
| ReDoc | http://localhost:8001/redoc |
| Health check | http://localhost:8001/health |
| Фронтенд | http://localhost:3003 |

---

## Переменные окружения (backend)

Скопировать: `cp backend/.env.example backend/.env`

Обязательные: `SECRET_KEY`, `DATABASE_URL`, `DATABASE_URL_SYNC`.  
Для Docker из корня backend значения по умолчанию в `.env.example` подходят (порт БД 15432 на хосте).

---

## Подтверждение email и оплаты (тест)

- **Регистрация:** без SMTP код подтверждения email выводится в терминал (или в `docker compose logs -f backend`). Строка: `>>> КОД ПОДТВЕРЖДЕНИЯ`.
- **Оплата:** после `POST /api/v1/payments/create-intent` в логах появляется `>>> PAYMENT: код подтверждения списания`. Этот код передаётся в `POST /api/v1/payments/confirm` в теле `{"payment_id": "...", "code": "123456"}`.

---

## Структура документации в Confluence (рекомендация)

1. **HomePilot — Документация проекта** (этот документ + CONFLUENCE_PROJECT_DOCUMENTATION.md)
2. **HomePilot — Краткая справка** (CONFLUENCE_QUICK_REFERENCE.md)
3. При необходимости — дочерние страницы: ТЗ (TECH_SPEC), ТЗ бэкенда (BACKEND_TZ_FASTAPI), UX/UI (UX_UI_DESIGN), Тарифы (TARIFFS_ALMATY), Бэклог (jira-backlog).
