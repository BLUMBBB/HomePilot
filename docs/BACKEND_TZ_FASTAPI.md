т# ТЗ на бэкенд HomePilot (FastAPI)

Техническое задание на серверную часть проекта HomePilot на базе **FastAPI**. Общий контекст и функциональные требования — в [общем ТЗ](TECH_SPEC.md).

---

## 1. Стек и окружение

### 1.1 Основные технологии

| Компонент | Технология |
|-----------|------------|
| Язык | Python 3.11+ |
| Фреймворк | FastAPI |
| Валидация и сериализация | Pydantic v2 |
| ORM | SQLAlchemy 2.x (async предпочтительно) |
| Миграции БД | Alembic |
| БД | PostgreSQL 14+ |
| Кэш / очереди | Redis (опционально на старте — для JWT blacklist и фоновых задач) |
| Хранение файлов | Локальная FS или S3-совместимое (MinIO, AWS S3) — конфигурируемо |
| Платежи | Интеграция с провайдером РК (API + webhook) |
| Email | SMTP или SendGrid/Mailgun — конфигурируемо |
| Конфигурация | Pydantic Settings (переменные окружения) |

### 1.2 Зависимости (основные)

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
pydantic
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
python-multipart
aiosqlite  # для тестов при необходимости
httpx       # для вызовов платёжного API и др.
```

Опционально: `celery` + `redis` для фоновых задач; `boto3` при использовании S3.

### 1.3 Окружения

- **development** — локальный запуск, БД и Redis локально или в Docker.
- **staging** — тестовый стенд, тестовые ключи платежей.
- **production** — прод БД, прод платежи, HTTPS, секреты из окружения.

---

## 2. Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, подключение роутеров
│   ├── config.py            # Settings (Pydantic BaseSettings)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py      # хэш пароля, JWT create/verify
│   │   ├── dependencies.py  # get_current_user, get_db, role checks
│   │   └── exceptions.py    # HTTPException и кастомные исключения
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py          # Base, metadata
│   │   ├── session.py       # async session, get_db
│   │   └── init_db.py       # создание таблиц / сиды при необходимости
│   ├── models/              # SQLAlchemy модели
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── city.py
│   │   ├── apartment_type.py
│   │   ├── tariff.py
│   │   ├── subscription.py
│   │   ├── visit.py
│   │   ├── payment.py
│   │   ├── support.py
│   │   └── ...
│   ├── schemas/             # Pydantic схемы (request/response)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── tariff.py
│   │   ├── subscription.py
│   │   ├── visit.py
│   │   ├── payment.py
│   │   └── support.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # общие зависимости (если дублируют core)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py    # объединение всех роутеров v1
│   │       ├── auth.py
│   │       ├── cities.py
│   │       ├── tariffs.py
│   │       ├── users.py     # /me
│   │       ├── subscriptions.py
│   │       ├── visits.py
│   │       ├── payments.py
│   │       ├── support.py
│   │       ├── executor/    # роуты исполнителя
│   │       │   ├── visits.py
│   │       │   └── profile.py
│   │       ├── admin/       # роуты админки
│   │       │   ├── users.py
│   │       │   ├── subscriptions.py
│   │       │   ├── visits.py
│   │       │   ├── executors.py
│   │       │   ├── tariffs.py
│   │       │   ├── support.py
│   │       │   └── payments.py
│   │       └── webhooks/
│   │           └── payment.py
│   ├── services/            # бизнес-логика
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── subscription.py  # создание подписки, визитов, пауза, отмена
│   │   ├── visit.py         # перенос, завершение, no_show
│   │   ├── payment.py       # создание платежа, обработка webhook
│   │   ├── support.py
│   │   └── storage.py      # загрузка/сохранение файлов
│   └── utils/
│       ├── __init__.py
│       └── i18n.py          # локализация текстов (ru/kk)
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/
│   ├── conftest.py          # fixtures, test client
│   ├── test_auth.py
│   ├── test_subscriptions.py
│   └── ...
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

Префикс API: `/api/v1` для всех эндпоинтов (в `main.py` подключается `app.include_router(api_v1_router, prefix="/api/v1")`).

---

## 3. Конфигурация (config.py)

Использовать **Pydantic Settings** с чтением из окружения (и `.env`):

- `SECRET_KEY` — секрет для JWT.
- `ALGORITHM` — HS256.
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`.
- `DATABASE_URL` — строка подключения к PostgreSQL (async: `postgresql+asyncpg://...`).
- `REDIS_URL` — опционально.
- `CORS_ORIGINS` — список разрешённых origin для фронта.
- `UPLOAD_DIR` или `S3_BUCKET`, `S3_ENDPOINT`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` — хранение файлов.
- `PAYMENT_PROVIDER`, `PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET` — платёжный провайдер.
- `SMTP_*`, `EMAIL_FROM` — отправка писем.
- `LOCALE_DEFAULT` — ru / kk.

---

## 4. Модели данных (SQLAlchemy)

Ниже — перечень таблиц и полей. Типы и ограничения задать в моделях и в миграциях Alembic.

> **Важно. Этапы внедрения.** Для MVP допустимо использовать исходную упрощённую схему (из первоначального варианта ТЗ):  
> — `tariffs` с полями `cleaning_type`, `visits_per_month`, `has_linen/has_plants/has_ironing`;  
> — чек-листы только по типу уборки;  
> — без отдельных таблиц `task_categories` и `visit_tasks`, а дополнительные бытовые задачи фиксировать через расширенные чек-листы и комментарии к визиту.  
> 
> Описанные ниже сущности и поля (`slots_per_month`, `allowed_task_categories`, `task_categories`, `visit_tasks`, `task_options`) — это **целевое расширение после MVP**, не обязательное для первой версии бэкенда.

### 4.1 users

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | |
| email | String, unique, not null | |
| password_hash | String, nullable | для executor по приглашению может заполняться позже |
| role | Enum('client','executor','admin','support') | |
| name | String | |
| phone | String | |
| locale | String(5), default 'ru' | ru / kk |
| is_active | Boolean, default True | |
| email_verified_at | DateTime, nullable | |
| created_at | DateTime | |
| updated_at | DateTime | |
| photo_url | String, nullable | в основном для executor |
| executor_status | Enum('active','blocked'), nullable | только для role=executor |
| executor_invite_code | String, nullable, unique | код приглашения (если ещё не зарегистрирован — отдельная сущность или поле) |

Для приглашения исполнителя можно завести таблицу **executor_invites** (code, created_by_id, expires_at, used_by_id nullable).

### 4.2 cities

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| code | String, unique (e.g. almaty) |
| name_ru | String |
| name_kk | String |
| is_active | Boolean, default True |
| created_at, updated_at | DateTime |

### 4.3 apartment_types

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| code | String, unique (studio, 1room, 2room, 3room) |
| name_ru | String |
| name_kk | String |
| duration_light_min | Integer |
| duration_full_min | Integer |
| created_at, updated_at | DateTime |

### 4.4 tariffs

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| code | String, unique (start, basic, optimum, comfort, premium) |
| name_ru | String |
| name_kk | String |
| slots_per_month | Integer (4 или 8) |
| default_slot_duration_min | Integer | рекомендуемая длительность слота |
| allowed_task_categories | JSONB | список кодов категорий задач и лимитов по ним (опционально, можно добавить после MVP) |
| is_active | Boolean, default True |
| sort_order | Integer |
| created_at, updated_at | DateTime |

### 4.5 tariff_prices

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| tariff_id | FK → tariffs |
| apartment_type_id | FK → apartment_types |
| price_month_kzt | Integer |
| created_at, updated_at | DateTime |
| Unique(tariff_id, apartment_type_id) |

### 4.6 task_categories, checklist_templates, checklist_items

- **task_categories**: id, code (cleaning, trash, shopping, pet_walk, minor_repair, errands и др.), name_ru, name_kk, default_duration_min, is_active, created_at, updated_at. (можно ввести после MVP; на старте категории задач зашиваются в код/чек-листы).
- **checklist_templates**: id, task_category_id (FK) или общий шаблон, apartment_type_id (nullable — общий шаблон), sort_order; created_at, updated_at.
- **checklist_items**: id, template_id (FK), title_ru, title_kk, sort_order; created_at, updated_at.

### 4.7 subscriptions

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| user_id | FK → users |
| tariff_id | FK → tariffs |
| apartment_type_id | FK → apartment_types |
| city_id | FK → cities |
| address_street | String |
| address_building | String |
| address_flat | String |
| address_entrance | String, nullable |
| address_floor | String, nullable |
| address_doorcode | String, nullable |
| address_comment | Text, nullable |
| preferred_days | JSONB | массив номеров дней недели 1–7 |
| time_slot_start | Time |
| time_slot_end | Time |
| task_options | JSONB | настройки по доступным категориям задач и лимитам (в т.ч. «премиальные» опции) — можно отложить и начать с текстового комментария к визиту |
| status | Enum('draft','active','paused','cancelled') |
| started_at | DateTime, nullable |
| ends_at | DateTime, nullable |
| paused_until | DateTime, nullable |
| executor_id | FK → users, nullable |
| auto_renew | Boolean, default True |
| created_at, updated_at | DateTime |

Статус **draft** — подписка создана, ожидает оплаты. После успешной оплаты — **active**, заполняются started_at, ends_at, создаются визиты.

### 4.8 visits

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| subscription_id | FK → subscriptions |
| executor_id | FK → users, nullable |
| scheduled_date | Date |
| time_slot_start | Time |
| time_slot_end | Time |
| status | Enum('scheduled','in_progress','completed','cancelled','no_show','rescheduled') |
| completed_at | DateTime, nullable |
| client_rating | Integer, nullable |
| reschedule_count_short | Integer, default 0 | переносы с уведомлением <24 ч в рамках этого визита/месяца — по логике |
| created_at, updated_at | DateTime |

Визит = слот бытовой помощи; для MVP достаточно чек-листа по выбранному тарифу и текстового комментария. Отдельная таблица `visit_tasks` может быть добавлена после запуска.

### 4.9 visit_tasks

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| visit_id | FK → visits |
| task_category_id | FK → task_categories |
| payload | JSONB | детали задачи (список покупок, комментарий по ремонту, маршрут выгула и т.п.) |
| planned_duration_min | Integer |
| status | Enum('planned','in_progress','completed','cancelled') |
| created_at, updated_at | DateTime |

### 4.10 visit_photos

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| visit_id | FK → visits |
| checklist_item_id | FK → checklist_items, nullable |
| file_path | String | путь в хранилище |
| file_size | Integer, nullable |
| content_type | String, nullable |
| uploaded_at | DateTime |

### 4.11 visit_checklist_results

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| visit_id | FK → visits |
| checklist_item_id | FK → checklist_items |
| done | Boolean |
| photo_id | FK → visit_photos, nullable |
| created_at, updated_at | DateTime |
| Unique(visit_id, checklist_item_id) |

### 4.12 payments

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| user_id | FK → users |
| subscription_id | FK → subscriptions, nullable |
| amount_kzt | Integer |
| currency | String(3), default 'KZT' |
| status | Enum('pending','completed','failed','refunded') |
| external_id | String, nullable |
| paid_at | DateTime, nullable |
| metadata | JSONB, nullable |
| created_at, updated_at | DateTime |

### 4.13 support_tickets

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| user_id | FK → users |
| visit_id | FK → visits, nullable |
| subject | String |
| status | Enum('open','in_progress','closed') |
| created_at, updated_at | DateTime |

### 4.13 support_messages

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| ticket_id | FK → support_tickets |
| author_id | FK → users |
| author_role | String | client / executor / admin / support |
| body | Text |
| created_at | DateTime |

### 4.14 executor_zones (опционально)

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| executor_id | FK → users |
| city_id | FK → cities |
| zone_name | String |
| created_at, updated_at | DateTime |

### 4.15 subscription_pauses (история пауз)

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| subscription_id | FK → subscriptions |
| paused_from | Date |
| paused_to | Date |
| reason | Text, nullable |
| created_at | DateTime |

### 4.16 executor_invites (приглашения исполнителей)

| Поле | Тип |
|------|-----|
| id | UUID (PK) |
| code | String, unique |
| created_by_id | FK → users (admin) |
| expires_at | DateTime |
| used_by_id | FK → users, nullable |
| used_at | DateTime, nullable |
| created_at | DateTime |

---

## 5. Авторизация и безопасность

### 5.1 Пароли

- Хэширование: **bcrypt** (через `passlib`). При регистрации и смене пароля — хэш сохранять в `users.password_hash`.
- Никогда не возвращать `password_hash` в API.

### 5.2 JWT

- **Access token**: в payload — `sub` (user id), `role`, `exp`, `type: "access"`. Срок жизни — 15–30 минут.
- **Refresh token**: `sub`, `exp`, `type: "refresh"`, при необходимости `jti` для инвалидации. Срок — 7–30 дней.
- Подпись: HS256, ключ из `SECRET_KEY`.
- В ответе логина: `access_token`, `refresh_token`, `token_type: "bearer"`, `expires_in` (секунды).
- Запросы: заголовок `Authorization: Bearer <access_token>`.
- Зависимость `get_current_user`: извлечь токен → верифицировать → загрузить user из БД → проверить `is_active` → вернуть user. При невалидном токене — 401.
- Опционально: blacklist refresh-токенов в Redis при выходе.

### 5.3 Проверка ролей

- Зависимости: `require_role("client")`, `require_role("executor")`, `require_role("admin")`, `require_role(["admin", "support"])`.
- После `get_current_user` проверить `current_user.role`; при несоответствии — 403.
- Исполнитель имеет доступ только к своим визитам; клиент — только к своим подпискам и визитам; админ/поддержка — по своим эндпоинтам.

### 5.4 CORS

- Разрешить только нужные origin из конфига (`CORS_ORIGINS`). В проде — только домен фронта.

---

## 6. API: эндпоинты по модулям

Базовый URL: `/api/v1`. Все ответы с ошибками — JSON в формате `{ "detail": "..." }` или списка ошибок валидации.

### 6.1 Публичные (без авторизации)

| Метод | Путь | Описание | Тело / Ответ |
|-------|------|----------|--------------|
| GET | /cities | Список активных городов | Query: locale (ru/kk). Response: список { id, code, name } (name по locale). |
| GET | /tariffs | Тарифы с ценами по типам квартир | Query: locale. Response: список тарифов, для каждого — slots_per_month, default_slot_duration_min, allowed_task_categories, prices по apartment_type. |
| GET | /apartment-types | Типы квартир | Query: locale. Response: список { id, code, name, duration_light_min, duration_full_min }. |
| POST | /auth/register | Регистрация клиента | Body: email, password, name, phone?, locale?. Response: 201, user (без пароля) + сообщение о подтверждении email (или сразу активный пользователь — по продукту). |
| POST | /auth/login | Вход | Body: email, password. Response: access_token, refresh_token, token_type, expires_in, user (краткий профиль). |
| POST | /auth/refresh | Обновление токена | Body: refresh_token. Response: access_token, expires_in. |
| POST | /auth/forgot-password | Запрос сброса пароля | Body: email. Response: 200 и сообщение «если email есть, отправлена ссылка». |
| POST | /auth/reset-password | Сброс пароля по токену из письма | Body: token, new_password. Response: 200. |
| GET | /legal/offer | Текст оферты | Query: locale. Response: { content: string } или HTML. |

Регистрация исполнителя: **POST /auth/register-executor** с телом `invite_code, email, password, name, phone` — доступен без токена, но код приглашения должен быть валидным и неиспользованным.

### 6.2 Профиль (клиент / любой авторизованный)

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| GET | /me | client, executor, admin, support | Текущий пользователь (id, email, name, phone, role, locale, для executor — photo_url, zones, status). |
| PATCH | /me | client, executor | Обновление name, phone, locale; для executor — photo. |
| POST | /me/change-password | client, executor | Body: current_password, new_password. |

### 6.3 Подписки (клиент)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /subscriptions | Создание подписки (draft). Body: tariff_id, apartment_type_id, city_id, address_*, preferred_days, time_slot_start, time_slot_end, task_options? (настройки по категориям задач в рамках тарифа), accept_offer: true. Response: subscription (id, status=draft, price_month_kzt). Далее клиент идёт на оплату. |
| GET | /subscriptions/current | Активная или последняя подписка клиента (с тарифом, адресом, визитами/слотами, исполнителем). 404 если нет. |
| GET | /subscriptions/{id} | Подписка по id (только своя). |
| PATCH | /subscriptions/{id} | Обновление: адрес, дни, время, task_options (если active). Либо запрос паузы (paused_until), отмены (status=cancelled, auto_renew=false). Валидация паузы: не более 2 недель подряд, не чаще N раз в год. |

### 6.4 Визиты (клиент)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /visits | Список визитов (слотов бытовой помощи) текущего клиента. Query: from_date, to_date, status. Response: список визитов с subscription, executor (name, photo), address и кратким списком задач. |
| GET | /visits/{id} | Детали визита; список задач (visit_tasks) с категориями и payload; если completed — фото-отчёт (visit_photos + checklist_results). Только свои визиты. |
| PUT | /visits/{id}/tasks | Настройка задач для визита. Body: tasks: [{ task_category_id, payload }] — с валидацией лимитов по тарифу и доступных категорий. Доступно до начала визита (например, не позже чем за 12 ч). |
| POST | /visits/{id}/reschedule | Перенос. Body: new_scheduled_date, new_time_slot_start, new_time_slot_end. Проверки: не менее 24 ч до старого визита; лимит «коротких» переносов в месяц (например 1). Возврат доступных слотов — отдельный эндпоинт или расчёт на бэкенде. |
| POST | /visits/{id}/complaint | Создать тикет поддержки, привязанный к visit_id. Body: subject, message. |

### 6.5 Платежи (клиент)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /payments | Список платежей текущего пользователя. |
| POST | /payments/create-intent | Body: subscription_id (draft), return_url?, cancel_url?. Создать платёж в провайдере на сумму подписки, сохранить payment (pending). Response: { payment_id, redirect_url } или { client_secret } — в зависимости от провайдера. |

### 6.6 Поддержка (клиент)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /support/tickets | Body: subject, message, visit_id?. Создать тикет и первое сообщение. |
| GET | /support/tickets | Список тикетов пользователя. |
| GET | /support/tickets/{id} | Тикет и сообщения (только свой). |
| POST | /support/tickets/{id}/messages | Body: body. Добавить сообщение от клиента. |

### 6.7 Исполнитель

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /executor/visits | Визиты исполнителя. Query: date_from, date_to (по умолчанию сегодня и +7 дней). |
| GET | /executor/visits/{id} | Детали визита: адрес, контакт клиента (телефон), время, список задач (категория + payload), чек-лист по задачам. |
| POST | /executor/visits/{id}/start | Статус визита → in_progress. |
| POST | /executor/visits/{id}/complete | Завершение. Body: results: [{ checklist_item_id, done, photo? }]. Либо multipart: файлы фото с именами checklist_item_id. Сохранить visit_checklist_results, visit_photos; статус визита → completed, completed_at. |
| POST | /executor/visits/{id}/upload-photo | Multipart: file + checklist_item_id. Привязать фото к визиту и пункту. |
| POST | /executor/visits/{id}/no-show | Отметить неявку клиента (status → no_show). |
| GET | /executor/profile | Профиль исполнителя (зоны, фото). |
| PATCH | /executor/profile | Обновление зон, фото (если разрешено). |

### 6.8 Админ

- **Клиенты:** GET /admin/users (query: role=client, search, limit, offset), GET /admin/users/{id} (полная карточка: подписки, визиты, платежи, тикеты).
- **Подписки:** GET /admin/subscriptions (фильтры: status, user_id), GET /admin/subscriptions/{id}, PATCH /admin/subscriptions/{id} (в т.ч. executor_id для закрепления).
- **Визиты:** GET /admin/visits (фильтры: date, executor_id, subscription_id, status), GET /admin/visits/{id}, PATCH /admin/visits/{id} (перенос, отмена), POST /admin/visits/{id}/assign-executor (body: executor_id).
- **Исполнители:** GET /admin/executors, GET /admin/executors/{id}, PATCH /admin/executors/{id} (executor_status: blocked и т.д.), POST /admin/executors/invite (body: email? или без — только код). Response: { invite_code, expires_at, link }.
- **Тарифы и цены:** GET/POST/PATCH/DELETE /admin/tariffs, GET/POST/PATCH /admin/tariff-prices, CRUD по checklist_templates и checklist_items.
- **Справочники:** CRUD /admin/cities, /admin/apartment-types.
- **Поддержка:** GET /admin/support/tickets (все тикеты, фильтры), GET /admin/support/tickets/{id}, POST /admin/support/tickets/{id}/messages (ответ от имени поддержки), PATCH /admin/support/tickets/{id} (status).
- **Платежи:** GET /admin/payments (фильтры: user_id, date_from, date_to, status).

### 6.9 Webhook

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /webhooks/payment | Тело от платёжного провайдера. Проверить подпись (webhook secret). При статусе «успешно»: обновить payment (completed, paid_at), активировать подписку (draft → active, started_at, ends_at), сгенерировать визиты на первый месяц. Ответ 200. |

---

## 7. Бизнес-логика (сервисы)

### 7.1 SubscriptionService

- **create_subscription(user_id, payload)** — создать запись subscription со статусом draft; рассчитать price_month_kzt по tariff_id и apartment_type_id; сохранить task_options (если переданы в payload); вернуть подписку.
- **activate_subscription(subscription_id)** — перевести в active, установить started_at, ends_at (текущая дата + 1 месяц), вызвать **generate_visits_for_period(subscription, from_date, to_date)**.
- **generate_visits_for_period(subscription, from_date, to_date)** — по preferred_days и time_slot_* создать визиты (scheduled) на указанный период, не более slots_per_month по тарифу. Если у подписки есть executor_id — проставить его визитам.
- **pause_subscription(subscription_id, paused_from, paused_to)** — проверить лимиты (2 недели макс., кол-во раз в год); записать subscription_pauses; установить subscription.paused_until = paused_to; визиты в этом периоде отменить или не создавать при продлении.
- **cancel_subscription(subscription_id)** — auto_renew = false; status при необходимости остаётся active до ends_at.
- **renew_subscription(subscription_id)** — при автопродлении (после webhook оплаты): продлить ends_at на месяц; сгенерировать визиты на новый месяц; учитывать паузу (не создавать визиты в paused_until).

### 7.2 VisitService

- **reschedule_visit(visit_id, new_date, new_time_start, new_time_end, user_id)** — проверить, что визит принадлежит клиенту; что до старого визита не менее 24 ч; счётчик коротких переносов в месяце (если < 24 ч — увеличить и проверить лимит 1). Обновить scheduled_date, time_slot_*; при необходимости status = rescheduled или оставить scheduled.
- **set_visit_tasks(visit_id, user_id, tasks)** — сохранить/обновить список задач визита (visit_tasks) с проверкой лимитов по тарифу и доступных категорий; разрешено только клиенту и только до наступления визита (например, не позже чем за 12 ч).
- **complete_visit(visit_id, executor_id, results, photos)** — проверить, что визит назначен этому исполнителю; по связанным задачам и чек-листам сохранить visit_checklist_results и visit_photos; установить status = completed, completed_at. Опционально: отправить клиенту уведомление (email).
- **no_show_visit(visit_id, executor_id)** — status = no_show; визит списывается с пакета (не переносится).

### 7.3 PaymentService

- **create_payment_intent(subscription_id, user_id, return_url)** — получить сумму из подписки; вызвать API провайдера; сохранить payment (pending, external_id); вернуть redirect_url или client_secret.
- **handle_webhook(payload, signature)** — верификация; найти payment по external_id; обновить status = completed, paid_at; вызвать activate_subscription или renew_subscription в зависимости от того, первая это оплата или продление.

### 7.4 StorageService (файлы)

- **save_visit_photo(visit_id, file: UploadFile, checklist_item_id?)** — проверить content-type (image/jpeg, image/png), размер (например макс. 10 MB); сгенерировать уникальное имя; сохранить в UPLOAD_DIR или S3; создать запись visit_photos; вернуть url или path для отдачи клиенту.
- Отдача файла: эндпоинт GET /api/v1/visits/{visit_id}/photos/{photo_id} с проверкой прав (клиент — свой визит, исполнитель — свой визит, админ — любой) или подписанная ссылка S3.

### 7.5 Notifications (опционально в MVP)

- **send_email(to, template_key, context, locale)** — шаблоны: registration_confirm, password_reset, visit_reminder, visit_completed. Использовать BackgroundTasks FastAPI или Celery для асинхронной отправки.

---

## 8. Валидация и ошибки

- Входные данные — через Pydantic-схемы. При ошибке валидации — 422 с перечнем полей.
- Бизнес-ошибки: выбрасывать HTTPException с нужным status_code (400, 403, 404, 409). В core/exceptions.py можно завести свои классы (SubscriptionNotFound, VisitNotReschedulable и т.д.) и обрабатывать в exception handler, возвращая единообразный JSON.
- 500 не показывать детали в проде; логировать stack trace в лог.

---

## 9. Миграции и сиды

- **Alembic**: автогенерация миграций по моделям; в env.py использовать DATABASE_URL из конфига (синхронный URL для Alembic, если нужен async — отдельно).
- **Сиды**: скрипт или миграция с данными для Алматы (city), типов квартир, тарифов, цен, чек-листов по тарифам — по документу [TARIFFS_ALMATY.md](TARIFFS_ALMATY.md).

---

## 10. Тестирование

- **pytest** + **httpx** (TestClient FastAPI).
- Фикстуры: тестовая БД (SQLite in-memory или отдельная PostgreSQL), создание пользователей (client, executor, admin), подписки, визитов.
- Покрыть: auth (register, login, refresh, смена пароля); создание подписки и активация после «оплаты»; перенос визита (успех и отказ при нарушении 24 ч); завершение визита исполнителем; права доступа (клиент не видит чужие визиты, исполнитель — только свои).
- Интеграция с платёжным webhook — мок тела запроса и проверка активации подписки и создания визитов.

---

## 11. Деплой и запуск

- **Запуск**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`. В проде — несколько воркеров за reverse proxy (nginx).
- **Health check**: GET /health или /api/v1/health — возврат 200 и, при необходимости, проверка подключения к БД и Redis.
- Переменные окружения задавать в системе или через .env; не коммитить секреты.
- Документация API: встроенная FastAPI — /docs (Swagger), /redoc.

---

Данный документ является ТЗ на бэкенд HomePilot на FastAPI и достаточен для начала разработки и оценки трудозатрат. Детали платёжного провайдера и форматов webhook уточняются при интеграции.
