# HomePilot — как всё запускать (копируй и вставляй)

Каждый раздел — самостоятельный сценарий: копируете блок команд целиком,
вставляете в терминал, смотрите, что должно получиться. Команды — для Git Bash
(идёт вместе с Git for Windows / Docker Desktop). Если у вас чистый PowerShell —
скажите, дам те же команды в PowerShell-синтаксисе (там `&&` не работает и
многострочные `export` пишутся иначе).

Все `cd` ниже используют `git rev-parse --show-toplevel` — это просто «корень
склонированного репозитория», работает на любой машине и в любой папке, куда
вы склонировали HomePilot, без привязки к конкретному пути/пользователю.

Для деплоя на прод-сервер — отдельный документ [DEPLOY.md](DEPLOY.md). Здесь —
только локальная разработка и проверки.

---

## 1. Поднять всё одной командой (Docker)

Самый простой способ увидеть сайт живьём. Один контейнер поднимает Postgres,
backend (FastAPI) и frontend (Vite), сам накатывает таблицы и сидит справочники
(города, тарифы, типы квартир).

Убедитесь, что Docker Desktop запущен, затем:

```bash
cd "$(git rev-parse --show-toplevel)"
docker compose up --build
```

Подождите, пока в логах не появится что-то вроде `Starting frontend (3003)` —
это займёт минуту-полторы на первый запуск (сборка образа).

**Что открыть после:**
- Сайт: http://localhost:3003
- API/Swagger: http://localhost:8001/docs
- Health-check: http://localhost:8001/health → должно вернуть `{"status":"ok",...}`

**Остановить:** нажмите `Ctrl+C` в этом же терминале, затем:
```bash
docker compose down
```
(данные БД останутся в volume; чтобы стереть вместе с данными — `docker compose down -v`)

---

## 2. Backend-тесты (pytest)

Тестам нужен **отдельный, одноразовый** Postgres — не тот, что в шаге 1
(там БД `homepilot`, тестам нужна чистая `homepilot_test`, иначе тесты одного
прогона будут видеть данные другого).

**Шаг 1 — поднять одноразовый Postgres на отдельном порту (5555):**
```bash
docker run -d --name homepilot_test_pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=homepilot_test \
  -p 5555:5432 postgres:16-alpine
```

**Шаг 2 — поставить зависимости (один раз, дальше не нужно):**
```bash
cd "$(git rev-parse --show-toplevel)/backend"
pip install -r requirements.txt -r requirements-dev.txt
```

**Шаг 3 — запустить тесты:**
```bash
cd "$(git rev-parse --show-toplevel)/backend"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5555/homepilot_test" \
DATABASE_URL_SYNC="postgresql://postgres:postgres@localhost:5555/homepilot_test" \
SECRET_KEY="test-secret-key-at-least-32-characters-long" \
python -m pytest tests/ -v
```

Ожидаемо: в конце `XX passed` зелёным. Таблицы создаются автоматически при
первом запуске, миграции гонять не нужно.

**Шаг 4 — убрать контейнер, когда закончили:**
```bash
docker rm -f homepilot_test_pg
```

> В CI (GitHub Actions) то же самое происходит автоматически в job `backend-test`
> из [.github/workflows/ci.yml](../.github/workflows/ci.yml) — руками там ничего делать не нужно,
> это только для локальной проверки.

---

## 3. Алерты и бэкапы (проверить, что скрипты не падают)

Оба скрипта написаны под прод-сервер, но безопасно прогнать и локально —
просто чтобы убедиться, что синтаксис/логика рабочие.

**Алерты (health-check + место на диске):**
```bash
cd "$(git rev-parse --show-toplevel)"
bash scripts/alerts.sh
```
Если backend из шага 1 запущен — увидите либо тишину (всё ок), либо строку
`ALERT: ...` в консоли. Без `ALERT_EMAIL_TO`/`SMTP_HOST` в `.env` письма не
шлются, только пишется в консоль/лог — это нормально для локальной проверки.

**Бэкап БД (только если поднят стек из шага 1):**
```bash
cd "$(git rev-parse --show-toplevel)"
PROJECT_DIR=. COMPOSE_FILE=docker-compose.yml BACKUP_DIR=/tmp/hp-backups bash scripts/backup.sh
```
Проверить результат:
```bash
ls -la /tmp/hp-backups
```
Должен появиться файл вида `homepilot_20260707_120000.sql.gz`.

**На проде** (не для локалки, просто для справки) — оба скрипта прописываются
в crontab сервера, см. [DEPLOY.md §8](DEPLOY.md#8-backups-and-alerts-cron):
```cron
0 3 * * *  /opt/homepilot/scripts/backup.sh >> /var/log/homepilot-backup.log 2>&1
*/5 * * * * /opt/homepilot/scripts/alerts.sh >> /var/log/homepilot-alerts.log 2>&1
```

---

## 4. PostHog (аналитика) — настройка и проверка

Без ключей все события — no-op (ни фронт, ни бэк ничего никуда не шлют).

**Шаг 1 — завести проект.** Зайти на https://posthog.com → создать проект →
скопировать **Project API Key** и **host** (обычно `https://eu.i.posthog.com`).

**Шаг 2 — создать `frontend/.env`** (файла ещё нет, создайте):
```bash
cd "$(git rev-parse --show-toplevel)/frontend"
printf 'VITE_POSTHOG_KEY=phc_ВАШ_КЛЮЧ\nVITE_POSTHOG_HOST=https://eu.i.posthog.com\n' > .env
```
(замените `phc_ВАШ_КЛЮЧ` на реальный ключ из шага 1)

**Шаг 3 — дописать в `backend/.env`** (файл уже есть, просто добавьте строки в конец):
```bash
cd "$(git rev-parse --show-toplevel)/backend"
printf '\nPOSTHOG_API_KEY=phc_ВАШ_КЛЮЧ\nPOSTHOG_HOST=https://eu.i.posthog.com\n' >> .env
```

**Шаг 4 — перезапустить** (`docker compose up --build` из шага 1, или
`uvicorn`/`npm run dev` вручную, если гоняете без Docker).

**Шаг 5 — проверить, что реально ушло:**
- Открыть сайт → DevTools (F12) → вкладка **Network** → в поиске набрать `posthog`
  → залогиниться на сайте → должен появиться POST-запрос со статусом 200
- В логах backend при старте должна быть строка
  `PostHog server-side analytics initialised (host=...)` — если её нет, ключ не подхватился
- В самом PostHog: **Activity → Explore** вашего проекта → там должны появиться
  события `sign_up`, `login` (с фронта) и `server_login`, `server_user_registered`,
  `server_subscription_activated` (с бэкенда) — обычно за несколько секунд

---

## 5. reCAPTCHA v3 (капча на регистрации и логине) — настройка и проверка

Тоже no-op без ключа: формы работают как обычно, просто без защиты от ботов.

**Шаг 1 — получить ключи.** https://www.google.com/recaptcha/admin →
создать ключ, тип **v3**, в домены добавить свой домен и `localhost`. Получите
**Site key** (публичный, для фронта) и **Secret key** (приватный, для бэка).

**Шаг 2 — дописать во `frontend/.env`:**
```bash
cd "$(git rev-parse --show-toplevel)/frontend"
printf '\nVITE_RECAPTCHA_SITE_KEY=6LВАШ_SITE_KEY\n' >> .env
```

**Шаг 3 — дописать в `backend/.env`:**
```bash
cd "$(git rev-parse --show-toplevel)/backend"
printf '\nRECAPTCHA_SECRET_KEY=6LВАШ_SECRET_KEY\n' >> .env
```

**Шаг 4 — перезапустить** оба процесса (как в разделе выше).

**Шаг 5 — проверить визуально:** открыть `/login` или `/register`, нажать
кнопку отправки формы — на секунду в правом нижнем углу экрана появится
серый значок reCAPTCHA. Это нормально, так и должно выглядеть (v3 «невидимая» —
без чекбокса и картинок).

**Проверить без своего ключа** (просто убедиться, что механизм рабочий, без
реальной регистрации в Google reCAPTCHA admin) — использовать публичный
тестовый ключ Google:
```bash
cd "$(git rev-parse --show-toplevel)/frontend"
printf 'VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI\n' > .env.local
npm run dev
```
Открыть http://localhost:3003/login, ввести любой email/пароль, нажать
«Войти» → DevTools → Network → должны появиться запросы к
`google.com/recaptcha/api.js` и `api2/anchor?...size=invisible`. После проверки
удалить файл:
```bash
rm "$(git rev-parse --show-toplevel)/frontend/.env.local"
```

---

## 6. Locust (нагрузочный тест)

**Только на localhost, никогда на боевом сервере** — тест реально создаёт
пользователей и подписки в базе, а прод VPS слабый (1 vCPU / 2GB).

**Шаг 1 — поднять backend + БД** (если ещё не запущены):
```bash
cd "$(git rev-parse --show-toplevel)"
docker compose up -d --build
```

**Шаг 2 — поставить Locust (один раз):**
```bash
pip install locust
```

**Шаг 3 — прогнать тест, 50 пользователей, 3 минуты, с сохранением результата в файл:**
```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p loadtest/results
locust -f loadtest/locustfile.py --host http://localhost:8001 \
  --users 50 --spawn-rate 5 --run-time 3m --headless \
  --csv loadtest/results/run1
```

**Шаг 4 — посмотреть результат:**
```bash
cat loadtest/results/run1_stats.csv
```
Ищите:
- **`Failure Count` / `Request Count`** — процент ошибок должен быть < 1%
- **колонка `95%`** — это p95 latency в миллисекундах, должна быть < 500

Если хотите смотреть вживую по мере прогона (веб-интерфейс с графиками) —
уберите `--headless` и `--csv`, откройте http://localhost:8089 после запуска
команды, там же нажимается кнопка Start.

---

## Быстрая справка: где что лежит

| Что | Файл |
|---|---|
| Dev docker-compose (всё в одном) | [docker-compose.yml](../docker-compose.yml) |
| Prod docker-compose | [docker-compose.prod.yml](../docker-compose.prod.yml) |
| Backend `.env` пример | [backend/.env.example](../backend/.env.example) |
| Тесты backend | [backend/tests/](../backend/tests/) |
| Алерты | [scripts/alerts.sh](../scripts/alerts.sh) |
| Бэкап БД | [scripts/backup.sh](../scripts/backup.sh) |
| PostHog backend-клиент | [backend/app/services/posthog_client.py](../backend/app/services/posthog_client.py) |
| reCAPTCHA backend-клиент | [backend/app/services/recaptcha.py](../backend/app/services/recaptcha.py) |
| Locust-тест | [loadtest/locustfile.py](../loadtest/locustfile.py) |
| CI (lint, pytest, deploy) | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| Деплой на прод-сервер | [DEPLOY.md](DEPLOY.md) |
