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

## 6) SSH deploy key setup (CI/CD)

The GitHub Actions pipeline deploys to the server via SSH using three repository secrets:

| Secret              | Value                                   |
|---------------------|-----------------------------------------|
| `SSH_HOST`          | `89.207.255.213`                        |
| `SSH_USER`          | SSH user on the server (e.g. `deploy`)  |
| `SSH_PRIVATE_KEY`   | Contents of the private key file        |

### Generate keys

```bash
bash scripts/setup-ssh-deploy.sh homepilot_deploy_key deploy 89.207.255.213
```

The script:
1. Generates an `ed25519` key pair.
2. Prints the `authorized_keys` command to run on the server.
3. Prints the private key to paste into **GitHub → Settings → Secrets → Actions**.

After uploading the private key to GitHub Secrets, delete the local key files:

```bash
rm -f homepilot_deploy_key homepilot_deploy_key.pub
```

### Manual steps on the server

```bash
# 1. Create deploy user (if not exists)
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# 2. Create the app directory
mkdir -p /opt/homepilot
chown deploy:deploy /opt/homepilot

# 3. Add the public key (paste from script output)
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
echo '<paste-public-key-here>' >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

## 7) Notes for production

- Keep `ENABLE_PUBLIC_UPLOADS=false` (default in production compose).
- Do not commit `.env`/secrets.
- Use managed PostgreSQL and object storage (S3-compatible) for high-load production.
- Add HTTPS and security headers on edge proxy.
