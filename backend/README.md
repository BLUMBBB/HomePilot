# HomePilot Backend (FastAPI)

Серверная часть сервиса подписки на бытовые услуги (уборка). См. [ТЗ в docs/BACKEND_TZ_FASTAPI.md](../docs/BACKEND_TZ_FASTAPI.md).

## Стек

- Python 3.11+, FastAPI, Pydantic v2
- SQLAlchemy 2.x (async), PostgreSQL 14+, Alembic
- JWT (python-jose), bcrypt (passlib)

---

## Подключение базы данных

Нужна **PostgreSQL 14+**. Ниже два варианта: через Docker (проще) или локальная установка.

### Вариант 1: PostgreSQL в Docker (рекомендуется)

Если имя `homepilot-db` уже занято старым контейнером, сначала удалите его:  
`docker rm -f homepilot-db`

```bash
# Запуск контейнера с PostgreSQL (порт на хосте 15432, чтобы не конфликтовать с другими БД)
docker run -d \
  --name homepilot-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=homepilot \
  -p 15432:5432 \
  postgres:16-alpine

# Проверка: контейнер запущен
docker ps
```

База `homepilot` создаётся автоматически. В `.env` укажите `localhost:15432` для подключения. Дальше — настройка `.env` и миграции (см. ниже).

### Вариант 2: Локальная установка PostgreSQL

Если PostgreSQL уже установлен (macOS: `brew install postgresql`, Ubuntu: `sudo apt install postgresql`):

```bash
# Войти в консоль PostgreSQL (пользователь postgres или ваш системный пользователь)
psql -U postgres

# В psql создать базу и при необходимости пользователя:
CREATE USER postgres WITH PASSWORD 'postgres';  -- если ещё нет
CREATE DATABASE homepilot OWNER postgres;
\q
```

### Настройка переменных окружения

Скопируйте пример и отредактируйте под свои хост/порт/логин/пароль:

```bash
cp .env.example .env
```

В `.env` задайте:

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Строка для **приложения** (async, драйвер `asyncpg`) | `postgresql+asyncpg://postgres:postgres@localhost:5432/homepilot` |
| `DATABASE_URL_SYNC` | Строка для **Alembic** (миграции, обычный драйвер) | `postgresql://postgres:postgres@localhost:5432/homepilot` |

Формат URL: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

- Если PostgreSQL на той же машине: `HOST=localhost`, порт по умолчанию `5432`.
- Для Docker из варианта 1 подойдут значения из `.env.example` без изменений.

### Создание таблиц и сиды

После того как БД доступна и `.env` настроен:

```bash
# 1. Создать миграцию и применить её (создаются все таблицы)
alembic revision --autogenerate -m "Initial"
alembic upgrade head

# 2. Заполнить справочники (город Алматы, типы квартир, тарифы)
python -m app.db.seed
```

Проверка: откройте http://localhost:8001/health после запуска приложения — если БД недоступна, при первом запросе к API может появиться ошибка подключения.

---

## Запуск через Docker (БД + бэкенд)

Из каталога `backend` одной командой поднимаются PostgreSQL и приложение; таблицы создаются автоматически, затем выполняются сиды.

```bash
cd backend
docker compose up --build
```

- **PostgreSQL**: в контейнере слушает порт **5433** (не 5432, чтобы не конфликтовать с другими проектами). На хосте проброшен на **15432**. БД `homepilot`, пользователь/пароль `postgres`/`postgres`. Подключение с хоста (psql, DBeaver): `localhost:15432`.
- **API**: http://localhost:8001 (документация: http://localhost:8001/docs).

Порты можно менять в `docker-compose.yml`: в `command` контейнера db — порт внутри контейнера; в `ports` — проброс на хост; в `environment` backend — порт для подключения к db.

Остановка: `Ctrl+C`, затем `docker compose down`. Данные БД сохраняются в volume `homepilot_pgdata`, фото визитов — в папке `backend/uploads` на хосте.

### Запуск в фоне (чтобы терминал был свободен)

Если нужен свободный терминал для других команд (например, смотреть логи отдельно):

```bash
cd backend
docker compose up --build -d
```

Контейнеры запустятся в фоне. Дальше можно вводить любые команды в этом же терминале:

```bash
# Смотреть логи бэкенда в реальном времени (в т.ч. «письмо» при регистрации)
docker compose logs -f backend

# Остановить всё
docker compose down
```

`-d` (detached) — запуск в фоне; без `-d` — логи идут в текущий терминал и он занят до Ctrl+C.

---

## Быстрый старт (без Docker)

(После того как БД создана и миграции применены.)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Задайте DATABASE_URL и DATABASE_URL_SYNC в .env (см. раздел «Подключение базы данных»)
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Порт по умолчанию — **8001** (можно задать в `.env`: `PORT=8001` или в команде: `--port 8001`).

- API: http://localhost:8001
- Документация: http://localhost:8001/docs
- Health: http://localhost:8001/health

## Дальнейшие миграции

При изменении моделей в коде:

```bash
alembic revision --autogenerate -m "Описание изменений"
alembic upgrade head
```

## Переменные окружения

См. `.env.example`. Обязательные: `SECRET_KEY`, `DATABASE_URL`. В проде задавайте секреты через окружение, не коммитьте `.env`.

---

## Подтверждение email при локальной разработке

При регистрации клиент получает **6-значный код** на email. Бэкенд отправляет письмо с кодом. Если **SMTP не настроен** (в `.env` не заданы `SMTP_HOST` и `EMAIL_FROM`), письмо **никуда не отправляется**, а **печатается в терминал**, где запущен uvicorn.

**Как проверить регистрацию локально:**

1. Запустите бэкенд в терминале: `uvicorn app.main:app --reload --port 8001`
2. На фронтенде зарегистрируйтесь (любой email, пароль).
3. Посмотрите в терминал (или в `docker compose logs -f backend`, если бэкенд в Docker). Появится блок письма и строка **`>>> КОД ПОДТВЕРЖДЕНИЯ`** — введите этот 6-значный код на странице подтверждения.
   ```
   === EMAIL (SMTP не настроен) ===
   ...
   >>> КОД ПОДТВЕРЖДЕНИЯ (введите на странице подтверждения):
   >>> 123456
   === END EMAIL ===
   ```
4. Введите код на странице подтверждения email и нажмите «Подтвердить и войти».
5. После успешного подтверждения можно войти по этому email и паролю.

**Важно:** страница регистрации **должна вызывать бэкенд API** (не mock). В прототипе (design/prototype) Register уже подключён к бэкенду. Ссылка выводится **только в момент нажатия «Зарегистрироваться»**. Порядок действий:
1. В одном терминале: `docker compose logs -f backend` (оставьте работающим).
2. Запустите фронт: из папки `frontend` выполните `npm run dev` (порт 3003) или прототип из `design/prototype` — `npm run dev` (порт 3000, при необходимости укажите другой в vite.config).
3. Откройте в браузере http://localhost:3003 (или порт прототипа), перейдите в «Регистрация», заполните форму и нажмите «Зарегистрироваться».
4. Сразу в логах бэкенда должны появиться строки `>>> REGISTER: запрос получен` и `>>> КОД ПОДТВЕРЖДЕНИЯ` с 6-значным кодом.

**Если код не появляется:** в логах при отправке формы должна быть хотя бы строка `>>> REGISTER: запрос получен`. Если её нет — запрос не доходит до бэкенда (проверьте, что фронт запущен и вы открываете его). Если есть «запрос получен», но нет блока с письмом — возможно, этот email уже зарегистрирован (попробуйте другой).

Чтобы письма с кодом реально уходили на почту, настройте в `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.

---

## Очистка подписок

Чтобы удалить все подписки пользователей (визиты и паузы удаляются каскадно), запустите из корня backend в активированном venv:

```bash
python scripts/clear_subscriptions.py
```

Или через `uv run`: `uv run python scripts/clear_subscriptions.py`.

## Подтверждение оплаты (тестовый этап)

Оплата подписки на тестовом этапе **не настоящая**: после создания платежа (POST `/api/v1/payments/create-intent`) бэкенд генерирует **6-значный код подтверждения списания** и выводит его в терминал (как код при регистрации). Клиент вводит этот код на странице оплаты и отправляет запрос POST `/api/v1/payments/confirm` с телом `{"payment_id": "...", "code": "123456"}`. При верном коде платёж помечается проведённым и подписка активируется.

**Как проверить:** создайте подписку (draft), вызовите `create-intent`, в логах бэкенда появится строка `>>> PAYMENT: код подтверждения списания ...` — введите этот код в запросе `confirm`.
