# HomePilot — фронтенд (React)

Веб-приложение на React (Vite + TypeScript): главная страница, регистрация и авторизация. Дизайн-система из [design/](../design/) перенесена в `src/index.css`.

## Стек

- React 18, TypeScript
- Vite 5
- React Router 6

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на **http://localhost:3003**.

## Сборка

```bash
npm run build
npm run preview   # просмотр production-сборки
```

## Интеграция с бэкендом

В режиме разработки запросы к `/api` проксируются на **http://localhost:8001** (см. `vite.config.ts`). Убедитесь, что бэкенд запущен на порту 8001.

- **Регистрация**: `POST /api/v1/auth/register` (email, password, name, phone?, locale?)
- **Вход**: `POST /api/v1/auth/login` (email, password) → access_token, refresh_token, user
- Токены хранятся в `localStorage`; после входа в шапке отображаются имя пользователя и кнопка «Выйти».

## Маршруты

| Путь       | Описание           |
|-----------|--------------------|
| `/`       | Главная (лендинг)  |
| `/login`  | Вход               |
| `/register` | Регистрация (поддерживается `?tariff=...`) |

Остальные разделы (кабинет клиента, исполнителя, админка) планируются к реализации позже.
