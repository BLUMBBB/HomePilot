#!/bin/bash
# Basic uptime/capacity alerting — запускать через cron:
# */5 * * * * /opt/homepilot/scripts/alerts.sh >> /var/log/homepilot-alerts.log 2>&1
#
# Two checks:
#   1. Backend /health endpoint is reachable and reports database: ok
#   2. Root filesystem usage is below a threshold (backups/logs/docker layers filling disk)
# On failure, sends an email via SMTP (same creds as the app) if configured,
# otherwise just prints to stdout so it still shows up in the cron log.
set -uo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/homepilot}"
HEALTH_URL="${HEALTH_URL:-http://localhost/health}"
DISK_THRESHOLD_PERCENT="${DISK_THRESHOLD_PERCENT:-85}"

cd "$PROJECT_DIR" 2>/dev/null || true
set -a
[ -f .env ] && . ./.env
set +a
ALERT_EMAIL_TO="${ALERT_EMAIL_TO:-${EMAIL_FROM:-}}"

send_alert() {
    local subject="$1"
    local body="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $subject"
    echo "$body"
    if [ -z "$ALERT_EMAIL_TO" ] || [ -z "${SMTP_HOST:-}" ]; then
        return 0
    fi
    ALERT_SUBJECT="$subject" ALERT_BODY="$body" ALERT_TO="$ALERT_EMAIL_TO" \
        SMTP_HOST="$SMTP_HOST" SMTP_PORT="${SMTP_PORT:-587}" \
        SMTP_USER="${SMTP_USER:-}" SMTP_PASSWORD="${SMTP_PASSWORD:-}" \
        EMAIL_FROM="${EMAIL_FROM:-$ALERT_EMAIL_TO}" \
        python3 - <<'PYEOF'
import os
import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg["From"] = os.environ["EMAIL_FROM"]
msg["To"] = os.environ["ALERT_TO"]
msg["Subject"] = f"[HomePilot ALERT] {os.environ['ALERT_SUBJECT']}"
msg.set_content(os.environ["ALERT_BODY"])

try:
    with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.environ["SMTP_PORT"]), timeout=15) as server:
        server.starttls()
        user = os.environ.get("SMTP_USER")
        password = os.environ.get("SMTP_PASSWORD")
        if user and password:
            server.login(user, password)
        server.send_message(msg)
except Exception as exc:  # noqa: BLE001
    print(f"alert email send failed: {exc}")
PYEOF
}

# --- Check 1: health endpoint pings the database -------------------------
HEALTH_BODY=$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null)
HEALTH_STATUS=$?
if [ "$HEALTH_STATUS" -ne 0 ]; then
    send_alert "Health check unreachable" "curl to $HEALTH_URL failed (exit code $HEALTH_STATUS)."
elif ! echo "$HEALTH_BODY" | grep -q '"database":[[:space:]]*"ok"'; then
    send_alert "Health check degraded" "Response from $HEALTH_URL: $HEALTH_BODY"
fi

# --- Check 2: disk space --------------------------------------------------
DISK_USED_PERCENT=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ -n "$DISK_USED_PERCENT" ] && [ "$DISK_USED_PERCENT" -ge "$DISK_THRESHOLD_PERCENT" ]; then
    send_alert "Disk usage high" "Root filesystem is at ${DISK_USED_PERCENT}% (threshold ${DISK_THRESHOLD_PERCENT}%)."
fi

exit 0
