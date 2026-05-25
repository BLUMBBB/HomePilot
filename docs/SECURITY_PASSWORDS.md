# Пароли в HomePilot: построчный разбор и потоки данных

Подробное описание только цепочки **пароль → хэш → БД → проверка**. Общий обзор безопасности: [SECURITY.md](./SECURITY.md).

**Ключевые файлы (репозиторий HomePilot):**

| Роль | Путь |
|------|------|
| Хэш и проверка (bcrypt) | [backend/app/core/security.py](/Users/nurss/nurss/HomePilot/backend/app/core/security.py) |
| Регистрация, логин | [backend/app/services/auth.py](/Users/nurss/nurss/HomePilot/backend/app/services/auth.py) |
| HTTP: регистрация/логин | [backend/app/api/v1/auth.py](/Users/nurss/nurss/HomePilot/backend/app/api/v1/auth.py) |
| HTTP: смена пароля | [backend/app/api/v1/users.py](/Users/nurss/nurss/HomePilot/backend/app/api/v1/users.py) |
| Валидация полей JSON | [backend/app/schemas/auth.py](/Users/nurss/nurss/HomePilot/backend/app/schemas/auth.py) |
| Колонка в БД | [backend/app/models/user.py](/Users/nurss/nurss/HomePilot/backend/app/models/user.py) |
| Запросы с паролем (фронт) | [frontend/src/api/client.ts](/Users/nurss/nurss/HomePilot/frontend/src/api/client.ts) |

---

## 1. Что делает фронтенд, что делает бэкенд

**Фронтенд** только:

- Собирает пароль из формы и отправляет его **в открытом виде** в теле HTTPS/HTTP-запроса (JSON).
- Для регистрации/логина — см. `login()` и `register()` в `frontend/src/api/client.ts`: `JSON.stringify(body)`, где `body` содержит `password`.
- **Не** хэширует пароль: хэширование выполняется **только на сервере**. Это нормальная схема (сервер должен проверять пароль сам; клиентский «хэш» не заменяет секрет).

**Бэкенд**:

1. Принимает JSON, **валидирует** структуру и часть правил (длина пароля) через Pydantic в `schemas/auth.py`.
2. Вызывает `get_password_hash` при **создании** или **смене** пароля — в памяти процесса Python вычисляется bcrypt-хэш.
3. В БД сохраняется **только** строка `password_hash`, не исходный пароль.
4. При **входе** или **смене пароля** читает хэш из БД и вызывает `verify_password` — bcrypt сравнивает введённый пароль с сохранённым хэшем.

**Транспорт:** в продакшене обязателен **HTTPS**, иначе пароль в JSON может быть перехвачен. Код приложения этим не занимается — настраивается сервер/прокси.

---

## 2. Модуль `security.py`: импорты и контекст

Файл: [backend/app/core/security.py](/Users/nurss/nurss/HomePilot/backend/app/core/security.py)

| Строки | Что происходит |
|--------|----------------|
| **1** | Докстринг модуля: здесь не только пароли, но и JWT (ниже по файлу). Для паролей используются строки **11–21**. |
| **2–7** | Импорты для JWT и типов — **к работе паролей не относятся** (нужны для `create_access_token` и т.д.). |
| **5** | `import bcrypt` — нативная библиотека bcrypt для Python: `hashpw`, `checkpw`, `gensalt`. |
| **8** | `get_settings` здесь используется в функциях JWT, **не** в `get_password_hash` / `verify_password`. |

---

## 3. Функция `verify_password` — построчно

Исходный фрагмент:

```11:15:backend/app/core/security.py
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password,
    )
```

| Строка / элемент | Что делает |
|------------------|------------|
| **`def verify_password(...)`** | Публичная функция: на вход приходит пароль в открытом виде (`plain_password`) и то, что лежит в БД (`hashed_password`). Возвращает `True`/`False`, без исключений при «неверном пароле». |
| **`plain_password.encode("utf-8")`** | Превращает строку Python в **байты UTF-8**. Bcrypt в этой библиотеке работает с **bytes**, не с `str`. Если пользователь ввёл кириллицу/эмодзи, правила UTF-8 задают однозначное представление байтами. |
| **`hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password`** | В БД и в модели SQLAlchemy хэш обычно приходит как **строка** (текст поля `password_hash`). Тогда его снова кодируют в bytes. Если по какой-то причине уже пришли **bytes**, их не перекодируют повторно. |
| **`bcrypt.checkpw(..., ...)`** | Внутри: из второго аргумента читается **соль и стоимость** (cost), встроенные в строку bcrypt; тот же алгоритм применяется к первому аргументу и результат сравнивается **по времени безопасным способом** (constant-time), чтобы усложнить утечку информации по замерам времени. |
| **`return ...`** | Результат `checkpw` уже `bool` — его и возвращают в `authenticate_user` и `change_password`. |

**Где вызывается на бэкенде:**

- [backend/app/services/auth.py](/Users/nurss/nurss/HomePilot/backend/app/services/auth.py) — строка **89**: при логине `verify_password(password, user.password_hash)`; если ложь — возвращается `None`, дальше API отдаёт «неверный email или пароль».
- [backend/app/api/v1/users.py](/Users/nurss/nurss/HomePilot/backend/app/api/v1/users.py) — строка **42**: перед сменой пароля проверяется текущий.

**На фронтенде** `verify_password` **не вызывается** — туда хэш с сервера для проверки не отдаётся.

---

## 4. Функция `get_password_hash` — построчно

Исходный фрагмент:

```18:21:backend/app/core/security.py
def get_password_hash(password: str) -> str:
    # bcrypt limit 72 bytes; truncate if longer
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")
```

| Строка / элемент | Что делает |
|------------------|------------|
| **`def get_password_hash(password: str) -> str`** | Принимает пароль от пользователя (уже после Pydantic на роуте). Возвращает **строку** — то, что пишется в `users.password_hash`. |
| **Комментарий про 72 байта** | Алгоритм bcrypt использует не более **72 байт** входа. Если передать длиннее, разные реализации могли бы вести себя по-разному; явная обрезка **до 72 байт** делает поведение **предсказуемым**: длинный пароль эквивалентен своему префиксу в 72 байта. |
| **`password.encode("utf-8")`** | Снова перевод пароля в байты UTF-8. |
| **`[:72]`** | Срез: берутся только первые 72 байта. Важно: это **байты**, не символы (один символ UTF-8 может занимать до 4 байт). |
| **`bcrypt.gensalt()`** | Генерирует **случайную соль** (и параметр work factor по умолчанию в библиотеке). Каждый вызов для одного и того же пароля даёт **разный** хэш — так в базе нельзя увидеть, что два пользователя задали одинаковый пароль, и усложняется перебор по радужным таблицам. |
| **`bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())`** | Считает bcrypt-хэш: в результат входят версия формата, cost, соль и собственно хэш. Всё это кодируется в одну ASCII-строку вида `$2b$...`. |
| **`.decode("utf-8")`** | `hashpw` возвращает **bytes**; для записи в колонку String и для последующего `verify_password` (когда строка снова кодируется в bytes) результат приводят к **str**. |
| **`return ...`** | Эта строка попадает в `User.password_hash` и уходит в PostgreSQL. |

**Где вызывается на бэкенде:**

- `register_client` / `register_executor` — [auth.py сервис, строки 37 и 70](/Users/nurss/nurss/HomePilot/backend/app/services/auth.py).
- `change_password` — [users.py API, строка 45](/Users/nurss/nurss/HomePilot/backend/app/api/v1/users.py).

**Исходный пароль** после вызова `get_password_hash` нигде не сохраняется — только возвращённая строка хэша.

---

## 5. Хранение в БД

Файл модели: [backend/app/models/user.py](/Users/nurss/nurss/HomePilot/backend/app/models/user.py)

- **`password_hash: Mapped[str | None]`** (около строки **32**): колонка для bcrypt-строки; `nullable=True` допускает пользователей без пароля (например, будущие сценарии OAuth — в текущей логике регистрации пароль задаётся).
- Длина **255** символов достаточна для стандартной bcrypt-строки.

Пароль в открытом виде в таблице **не хранится**.

---

## 6. Валидация до хэширования (Pydantic)

Файл: [backend/app/schemas/auth.py](/Users/nurss/nurss/HomePilot/backend/app/schemas/auth.py)

| Поле | Правило | Смысл |
|------|---------|--------|
| `RegisterRequest.password` | `min_length=8` | Минимум 8 символов **в строке Python** (символы Unicode, не «8 байт»). |
| `RegisterExecutorRequest.password` | то же | Для исполнителя. |
| `LoginRequest.password` | без `min_length` | Любая длина на входе; неверный пароль отсекается уже bcrypt-сравнением. |
| `ChangePasswordRequest` | `current_password` без min, `new_password` min 8 | Старый пароль как есть; новый — с порогом длины. |

Это выполняется **на бэкенде** при разборе тела запроса FastAPI + Pydantic **до** вызова сервисов. Фронт может дублировать проверку для UX, но **обязательна** проверка на сервере (уже есть).

---

## 7. Сценарий: регистрация клиента (сквозной поток)

1. **Фронт:** пользователь вводит email и пароль; `register()` в [client.ts](/Users/nurss/nurss/HomePilot/frontend/src/api/client.ts) (строки **109–119**) шлёт `POST /api/v1/auth/register` с JSON `{ email, password, ... }`.
2. **Бэкенд HTTP:** [auth.py](/Users/nurss/nurss/HomePilot/backend/app/api/v1/auth.py) `register` передаёт тело в `RegisterRequest`.
3. **Pydantic:** если пароль короче 8 символов — ответ с ошибкой валидации, `get_password_hash` **не вызывается**.
4. **Сервис:** [auth.py `register_client`](/Users/nurss/nurss/HomePilot/backend/app/services/auth.py) строки **31–44**: проверка уникальности email, создание `User` с `password_hash=get_password_hash(payload.password)`.
5. **БД:** `flush`/`commit` сохраняют только хэш; дальше отправка кода на email и т.д. — уже не про пароль.

Исполнитель: тот же `get_password_hash` в `register_executor` (строка **70**), после проверки инвайта.

---

## 8. Сценарий: вход (логин)

1. **Фронт:** [client.ts `login`](/Users/nurss/nurss/HomePilot/frontend/src/api/client.ts) (строки **67–74**) — `POST /auth/login` с `{ email, password }`.
2. **Бэкенд:** [auth.py `login`](/Users/nurss/nurss/HomePilot/backend/app/api/v1/auth.py) вызывает `authenticate_user(db, email, password)`.
3. **Сервис:** [auth.py строки 86–94](/Users/nurss/nurss/HomePilot/backend/app/services/auth.py): загрузка пользователя по email; если нет записи, нет `password_hash`, или `verify_password` вернул `False` — возвращается `None`, клиенту 401 «Неверный email или пароль».
4. Дополнительно для **client** без подтверждённого email — `ForbiddenError`, не `None` (отдельное сообщение).

Хэш при логине **не обновляется** — только проверка.

---

## 9. Сценарий: смена пароля (`/me/change-password`)

1. **Фронт:** запрос с заголовком `Authorization: Bearer <access>` и телом `{ current_password, new_password }` (см. `changePassword` в [client.ts](/Users/nurss/nurss/HomePilot/frontend/src/api/client.ts)).
2. **Бэкенд:** [dependencies.py](/Users/nurss/nurss/HomePilot/backend/app/core/dependencies.py) по токену загружает `current_user` из БД.
3. **Роут:** [users.py `change_password`](/Users/nurss/nurss/HomePilot/backend/app/api/v1/users.py) строки **35–47**:
   - `verify_password(payload.current_password, current_user.password_hash)` — если ложь → HTTP 400.
   - `current_user.password_hash = get_password_hash(payload.new_password)` — новый хэш.
   - `flush` — запись в БД.

Старый пароль после этого **невозможно** восстановить из БД (только сброс через новый пароль, когда реализуют forgot/reset).

---

## 10. Что в этом контуре не сделано

- **Восстановление пароля:** эндпоинты есть, логики смены по токену/письму в коде пока нет — см. [auth.py forgot/reset](/Users/nurss/nurss/HomePilot/backend/app/api/v1/auth.py).
- **Политика сложности** (заглавные, цифры, запрет утечек) — только `min_length=8` в Pydantic.
- **Двухфакторная аутентификация** — нет.

---

## 11. Связь с общим документом

Краткий раздел о паролях в [SECURITY.md §2](./SECURITY.md) можно дополнять ссылкой сюда: **подробности — [SECURITY_PASSWORDS.md](./SECURITY_PASSWORDS.md)**.
