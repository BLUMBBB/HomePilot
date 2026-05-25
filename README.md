# HomePilot

**Подписка на бытовую помощь по дому** — не разовые заказы, а регулярные визиты по расписанию: уборка, мусор, закупки и другие задачи с чек-листами и фото-отчётом после визита.

*Home subscription-style housekeeping: scheduled visits, checklists, and photo reports.*

---

## Что внутри репозитория

| Часть | Технологии | Описание |
|--------|------------|----------|
| **backend/** | Python 3.11+, FastAPI, SQLAlchemy 2 (async), PostgreSQL, Alembic | API, авторизация, подписки, визиты, платежи (mock / Stripe) |
| **frontend/** | React 18, TypeScript, Vite | Лендинг, личный кабинет клиента, кабинет исполнителя, админ-разделы |
| **docker-compose.yml** | Docker Compose | PostgreSQL + один контейнер с бэкендом и фронтом для быстрого старта |
| **docs/** | Markdown | Описание продукта, деплой, безопасность, бэклог |

Подробнее о продукте: [`docs/PROJECT_DESCRIPTION.md`](docs/PROJECT_DESCRIPTION.md).

---

## Быстрый старт (Docker)

Требуется **Docker** и **Docker Compose v2**.

```bash
docker compose up --build
```

После сборки и старта:

- **Фронтенд:** http://localhost:3003  
- **API / Swagger:** http://localhost:8001/docs  
- **PostgreSQL** на хосте: `localhost:15432` (внутри сети compose — сервис `db`)

Переменные по умолчанию заданы в `docker-compose.yml`; для продакшена см. [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## Локальная разработка (без Docker для кода)

1. **База:** PostgreSQL 14+ (удобно — контейнер из [`backend/README.md`](backend/README.md)).  
2. **Бэкенд:** скопировать `backend/.env.example` → `backend/.env`, выставить `DATABASE_URL` / `DATABASE_URL_SYNC`, затем миграции и сиды по инструкции в `backend/README.md`.  
3. **Фронт:** `cd frontend && npm install && npm run dev` — dev-сервер на **http://localhost:3003**, прокси API на порт **8001** (см. `frontend/vite.config.ts`).

Секреты и локальные `.env` в git **не попадают** (см. `.gitignore`).

---

## Структура каталогов (кратко)

```
backend/     # FastAPI-приложение
frontend/    # React (Vite)
design/      # дизайн-материалы (в .gitignore — при необходимости добавьте вручную)
docker/      # вспомогательные скрипты для compose-образа
docs/        # документация проекта
```

---

## Полезные ссылки

- [Описание проекта (RU)](docs/PROJECT_DESCRIPTION.md)  
- [Деплой](docs/DEPLOY.md)  
- [Бэкенд: установка и команды](backend/README.md)  
- [Фронтенд: запуск и сборка](frontend/README.md)

---

## Статус

MVP: цикл «тарифы → подписка → визиты → фото-отчёт», роли клиента и исполнителя, админ-интерфейс в развитии. Рынок и валюта ориентированы на **Казахстан** (тенге, ru/kk).

Проект ведётся как монорепозиторий; ветка по умолчанию — **`main`**.
