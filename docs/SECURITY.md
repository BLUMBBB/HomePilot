# Безопасность HomePilot — реализация и пробелы

Документ описывает **что уже сделано в коде**, **где это лежит** и **чего нет**. Пути указаны от корня репозитория (`backend/…`, `frontend/…`).

---

## 1. Обзор архитектуры

- **Бэкенд:** FastAPI, аутентификация по **JWT** (access + refresh), пароли — **bcrypt**.
- **Авторизация:** после проверки токена пользователь загружается из БД; доступ к данным ограничивается **привязкой к `current_user.id`** (владелец подписки / визита) и отдельной проверкой роли **исполнителя** на префиксе `/executor`.
- **Публичные маршруты:** регистрация, вход, обновление токена, подтверждение email, справочники (`cities`, `tariffs`, `apartment_types`), юридические тексты, **webhook платежей** (без JWT).
- **Фронтенд:** токены в браузере, запросы с заголовком `Authorization: Bearer …`, при 401 — попытка **refresh**, затем повтор запроса или очистка сессии.

Сводка подключения роутеров: `backend/app/api/v1/router.py`.

---

## 2. Пароли (bcrypt)

**Подробный построчный разбор, потоки фронт/бэк и ссылки на код:** [SECURITY_PASSWORDS.md](./SECURITY_PASSWORDS.md).

**Файл:** `backend/app/core/security.py`

**Что сделано:**

- `get_password_hash(password)` — хэш через `bcrypt.hashpw` + `bcrypt.gensalt()`, результат в виде строки UTF-8.
- `verify_password(plain, hashed)` — `bcrypt.checkpw`.
- **Ограничение bcrypt 72 байта:** перед хэшированием пароль обрезается до первых 72 байт в UTF-8 (`pwd_bytes = password.encode("utf-8")[:72]`). Это стандартная мера, чтобы не получить «тихую» обрезку на стороне bcrypt.

**Где используется:**

- Регистрация клиента и исполнителя — `backend/app/services/auth.py` (`register_client`, `register_executor`).
- Смена пароля — `backend/app/api/v1/users.py` (`change_password`) с обязательной проверкой текущего пароля через `verify_password`.

**Рекомендации для продакшена:** политика сложности пароля на фронте/в схемах Pydantic (минимальная длина, состав символов) — при необходимости добавить отдельно; в текущем коде жёстких правил нет.

---

## 3. JWT (access, refresh, подтверждение email)

**Файл:** `backend/app/core/security.py`  
**Библиотека:** `python-jose` (`jose.jwt`).

**Типы токенов (поле `type` в payload):**

| Тип | Назначение | Срок жизни (источник) |
|-----|------------|------------------------|
| `access` | Доступ к защищённым API | `ACCESS_TOKEN_EXPIRE_MINUTES` в `backend/app/config.py` |
| `refresh` | Получение новой пары токенов | `REFRESH_TOKEN_EXPIRE_DAYS` |
| `email_confirm` | Legacy-токен для подтверждения email (если используется) | `EMAIL_CONFIRM_TOKEN_EXPIRE_HOURS` |

Фактический поток подтверждения email в продукте — **6-значный код** в БД (см. раздел 5), а не только JWT `email_confirm`.

**Access-токен содержит:** `sub` (UUID пользователя), `role` (строка роли), `exp`, `type: access`.

**Проверка на бэкенде:** `decode_token` в `security.py`; при ошибке подписи/срока — `JWTError`, обработка через вызывающий код.

**Конфигурация секретов:** `backend/app/config.py` — `SECRET_KEY`, `ALGORITHM` (по умолчанию HS256). В продакшене **обязательно** задать надёжный `SECRET_KEY` через переменные окружения.

---

## 4. Извлечение текущего пользователя (`get_current_user`)

**Файл:** `backend/app/core/dependencies.py`

**Поведение:**

1. Ожидается заголовок `Authorization: Bearer <token>` (`HTTPBearer` из FastAPI).
2. Токен декодируется; должен быть `type == "access"`.
3. Из `sub` читается UUID пользователя, выполняется `SELECT` из БД.
4. Если пользователь не найден или **`is_active == False`** — отказ (исключение приложения).

**Важно:** роль в JWT есть, но для большинства эндпоинтов источником правды остаётся **модель `User` в БД** (в т.ч. `role`, `is_active`), а не только поле `role` из токена без повторной проверки (отдельная синхронизация «отозвать роль» через смену данных в БД работает после истечения access-токена или после следующего запроса, если логика завязана на БД).

---

## 5. Зависимость `require_role`

**Файл:** `backend/app/core/dependencies.py` — функция `require_role(*allowed_roles)`.

**Статус:** реализована как фабрика `Depends`, но **ни один роутер в проекте её не подключает** (поиск по репозиторию: использование только определение). То есть **RBAC вида «только admin» через эту зависимость пока не включён**.

Для исполнителя роль проверяется **вручную** в `backend/app/api/v1/executor/visits.py` (`_executor_only`).

---

## 6. Эндпоинты аутентификации

**Файл:** `backend/app/api/v1/auth.py`  
**Схемы:** `backend/app/schemas/auth.py`  
**Логика:** `backend/app/services/auth.py`

| Метод | Путь | Поведение |
|-------|------|-----------|
| POST | `/api/v1/auth/register` | Регистрация клиента, хэш пароля, создание 6-значного кода подтверждения email, отправка письма (или лог при отсутствии SMTP). |
| POST | `/api/v1/auth/register-executor` | Регистрация по **инвайт-коду** (`ExecutorInvite`), без публичной «свободной» регистрации исполнителя. |
| POST | `/api/v1/auth/login` | Проверка email/пароля; для роли **client** вход запрещён, пока не установлен `email_verified_at`. |
| POST | `/api/v1/auth/refresh` | Новая пара токенов по валидному refresh; пользователь должен быть активен. |
| POST | `/api/v1/auth/confirm-email` | Подтверждение по **коду** из письма. |
| POST | `/api/v1/auth/forgot-password` | Генерирует 6-значный код сброса (если email найден), сохраняет в `password_reset_codes`, отправляет письмо и всегда возвращает нейтральный ответ. |
| POST | `/api/v1/auth/reset-password` | Принимает 6-значный код и новый пароль, проверяет срок действия кода, обновляет `password_hash` и инвалидирует коды пользователя. |

Итог: базовый flow восстановления пароля реализован через одноразовый 6-значный код из письма.

---

## 7. Профиль и смена пароля

**Файл:** `backend/app/api/v1/users.py`  
Префикс роутера: `/me` (итого пути вида `/api/v1/me`).

- `GET /me` — текущий пользователь (нужен access-токен).
- `PATCH /me` — обновление полей профиля (имя, телефон, локаль).
- `POST /me/change-password` — смена пароля при верном `current_password`.

---

## 8. CORS

**Файлы:** `backend/app/main.py` (middleware), `backend/app/config.py` (`CORS_ORIGINS`).

- Разрешённые origin задаются списком или через env (см. парсинг в `main.py`: строка с запятыми → список).
- `allow_credentials=True`, методы и заголовки — широко (`*` для methods/headers).

**Продакшен:** ограничить `CORS_ORIGINS` явным списком доменов фронта, не использовать `*` для origin при credentials.

---

## 9. Статические загрузки (`/uploads`)

**Файл:** `backend/app/main.py` — монтирование `StaticFiles` на каталог `UPLOAD_DIR` управляется `ENABLE_PUBLIC_UPLOADS`.

По умолчанию `ENABLE_PUBLIC_UPLOADS=false`, поэтому приватные файлы нужно получать через защищённый API `GET /visits/{id}/photos/...` (см. раздел 10), а не прямым URL `/uploads/...`.

---

## 10. Изоляция данных клиента (подписки и визиты)

**Подписки:** `backend/app/api/v1/subscriptions.py`  
Все операции фильтруют `Subscription.user_id == current_user.id` (список, текущая, получение по id, обновление).

**Визиты клиента:** `backend/app/api/v1/visits.py`

- Список и детали визита — через join с `Subscription` и условием `Subscription.user_id == current_user.id`.
- **Фото:** `GET /visits/{visit_id}/photos/{filename}` — доступ, если пользователь **владелец подписки** или **назначенный исполнитель** этого визита; дополнительно отсекаются `..` и `/` в `filename` (защита от обхода пути).

Остальные действия (перенос, жалоба и т.д.) должны проходить через сервисный слой с проверкой владельца — при добавлении новых эндпоинтов сохранять тот же паттерн.

---

## 11. API исполнителя

**Файл:** `backend/app/api/v1/executor/visits.py`

- `_executor_only` — отказ, если `current_user.role != UserRole.executor`.
- Выборки визитов — по `Visit.executor_id == current_user.id`.
- Загрузка фото — через `backend/app/services/storage.py`.

---

## 12. Загрузка файлов (фото визита)

**Файл:** `backend/app/services/storage.py`

- Допустимые MIME: `image/jpeg`, `image/png`, `image/webp`.
- Максимальный размер: `MAX_UPLOAD_SIZE_MB` из настроек (по умолчанию 10 MB).
- Имя файла на диске — UUID + расширение из исходного имени; путь включает `visit_id`.

Это снижает риск загрузки исполняемых файлов и перегрузки диска, но **не заменяет** проверку магических байтов изображения (при необходимости усилить отдельно).

---

## 13. Платежи и webhook

**Webhook:** `backend/app/api/v1/webhooks/payment.py`  
**Обработка:** `backend/app/services/payment.py` (`handle_payment_webhook`)

- Эндпоинт **не** требует JWT.
- Подпись `x_webhook_signature` проверяется через HMAC-SHA256 (`PAYMENT_WEBHOOK_SECRET`) по raw body.
- Поддерживается формат заголовка `sha256=<hex>` и `<hex>`.
- При невалидной подписи webhook отклоняется с `401`.

**Рекомендация:** при подключении реального провайдера сверить точный формат подписи по их спецификации.

---

## 14. Rate limiting

- Добавлен базовый in-memory rate limit middleware (окно `RATE_LIMIT_WINDOW_SECONDS`).
- По умолчанию защищены:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/webhooks/payment`
- При превышении лимита возвращается `429`.

---

## 15. Остальные защищённые модули

- **Платежи (клиент):** `backend/app/api/v1/payments.py` — везде `CurrentUser`.
- **Поддержка:** `backend/app/api/v1/support.py` — `CurrentUser`.

Публичные справочники и `legal` — без токена (см. `router.py`).

---

## 16. Фронтенд

**Файл:** `frontend/src/api/client.ts`

- Сохранение access/refresh (реализация хранения — в этом файле и контексте).
- `authFetch`: добавление Bearer, при 401 — вызов `/auth/refresh`, повтор запроса, при неудаче — `clearAuth` и событие `AUTH_CLEARED_EVENT`.
- Публичные вызовы (`login`, `register`, `confirm-email`) идут без `authFetch`.

**Контекст:** `frontend/src/contexts/AuthContext.tsx` — обёртка приложения и использование в лейаутах/страницах.

---

## 17. Модели данных, связанные с безопасностью

- `backend/app/models/user.py` — `password_hash`, `role`, `is_active`, `email_verified_at`, связь с инвайтом исполнителя.
- `backend/app/models/executor_invite.py` — одноразовые/сроковые коды приглашения.
- `backend/app/models/email_confirm_code.py` — коды подтверждения email (сроки из настроек в сервисе auth).
- `backend/app/models/password_reset_code.py` — коды сброса пароля.

---

## 18. Что сознательно не сделано или в бэклоге

| Тема | Комментарий |
|------|-------------|
| Восстановление пароля | Реализовано через 6-значный код; можно усилить rate limit и anti-abuse защиту. |
| `require_role` для admin/support | Подключён в admin API; важно сохранять этот паттерн на новых staff/admin маршрутах. |
| Blacklist refresh / отзыв сессий | Упоминается в `docs/jira-backlog.md` (Redis и т.п.). |
| Rate limiting | Сейчас in-memory (подходит для single-instance). Для multi-instance нужен Redis-based limiter. |
| Security headers (HSTS, CSP для API-прокси) | Зависят от reverse proxy; в FastAPI не настроено отдельно. |
| Проверка подписи webhook | Базовая HMAC-проверка добавлена; может потребоваться адаптация под формат провайдера. |

---

## 19. Чек-лист перед продакшеном

1. Установить сильный `SECRET_KEY` и убедиться, что `.env` не в git.
2. Сузить `CORS_ORIGINS` до реальных доменов.
3. Проверить значения лимитов (`RATE_LIMIT_*`) под фактическую нагрузку и UX.
4. Проверить `PAYMENT_WEBHOOK_SECRET` и совместимость проверки подписи с реальным провайдером.
5. Убедиться, что в production `ENABLE_PUBLIC_UPLOADS=false`.
6. Подключать `require_role` (или аналог) для всех новых staff/admin маршрутов.
7. При масштабировании на несколько инстансов перейти на Redis-based rate limiting.

---

*Документ отражает состояние кодовой базы на момент последнего обновления файла. При изменении API правьте этот файл вместе с кодом.*
