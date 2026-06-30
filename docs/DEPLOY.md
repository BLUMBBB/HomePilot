# HomePilot deployment guide

## 1) Prerequisites

- Docker Engine 24+
- Docker Compose v2
- Public domain (recommended) and HTTPS termination (Nginx/Traefik/Cloud LB)

## 2) Required secrets/env

Set these in your shell, CI/CD, or `.env` file near `docker-compose.prod.yml`:

```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD='<strong-password>'
export POSTGRES_DB=homepilot
export SECRET_KEY='<min-32-char-random-secret>'
export PAYMENT_WEBHOOK_SECRET='<payment-webhook-secret>'
export FRONTEND_BASE_URL='https://your-domain.tld'
export CORS_ORIGINS='["https://your-domain.tld"]'
```

Optional:

```bash
export FRONTEND_PORT=80
export PAYMENT_PROVIDER=mock
```

## 3) Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4) Health checks

```bash
curl -fsS http://localhost/ >/dev/null && echo "Frontend OK"
curl -fsS http://localhost/health
```

Expected backend response:

```json
{"status":"ok","version":"1.0.0"}
```

## 5) Smoke gate (optional but recommended)

```bash
python3 backend/scripts/quality_gate_smoke.py --base-url http://localhost
```

## 6) Notes for production

- Keep `ENABLE_PUBLIC_UPLOADS=false` (default in production compose).
- Do not commit `.env`/secrets.
- Use managed PostgreSQL and object storage (S3-compatible) for high-load production.
- Add HTTPS and security headers on edge proxy.
