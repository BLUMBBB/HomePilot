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

## 7) CI/CD (GitHub Actions)

Pushes to `main` that pass lint/build trigger the `deploy` job in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It SSHes into the
server, updates the repo, and runs `docker compose -f docker-compose.prod.yml
up -d --build`.

### One-time server setup

1. Generate a CI→server SSH key pair (`scripts/setup-ssh-deploy.sh`) and add
   the public key to the server's `~/.ssh/authorized_keys` for the deploy user.
2. The repo is cloned over plain HTTPS (`git clone https://github.com/<org>/HomePilot.git`),
   which works without extra credentials for a public repo. If the repo is
   private, add a **read-only Deploy Key** under `Settings → Deploy keys` and
   switch the clone URL in `ci.yml` to the `git@github.com:...` SSH form.
3. Create a `.env` file next to `docker-compose.prod.yml` on the server with
   the production secrets listed in section 2.
4. Ensure Docker Engine 24+ and Docker Compose v2 are installed on the server.

### Required GitHub repository secrets

| Secret            | Value                                              |
|-------------------|-----------------------------------------------------|
| `SSH_HOST`        | Server IP/hostname                                   |
| `SSH_USER`        | Deploy user (e.g. `deploy`)                          |
| `SSH_PRIVATE_KEY` | Private half of the CI→server key from step 1        |
| `DEPLOY_PATH`     | Optional, absolute path to the repo on the server (defaults to `/opt/homepilot`) |

Set these under `Settings → Secrets and variables → Actions` in the GitHub
repo. Never commit private keys — `homepilot_deploy_key*` is gitignored.
