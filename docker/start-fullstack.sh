#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${DB_HOST:-db}:${DB_PORT:-5433}..."
for i in $(seq 1 30); do
  if python -c "
import socket, os
host = os.getenv('DB_HOST', 'db')
port = int(os.getenv('DB_PORT', '5433'))
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((host, port))
    s.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; then
    echo "PostgreSQL is ready."
    break
  fi
  echo "Attempt $i/30: waiting 2s..."
  sleep 2
done

cd /app/backend
echo "Creating database tables..."
python -m app.db.create_tables_sync
echo "Running seed (cities, apartment types, tariffs)..."
python -m app.db.seed

echo "Starting backend (8001)..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

echo "Starting frontend (3003)..."
cd /app/frontend
npm run dev -- --host 0.0.0.0 --port 3003 &
FRONTEND_PID=$!

shutdown() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap shutdown INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
