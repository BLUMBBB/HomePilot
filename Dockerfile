FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    libpq-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Frontend dependencies
COPY frontend/package.json frontend/package-lock.json /app/frontend/
RUN npm --prefix /app/frontend ci

COPY backend /app/backend
COPY frontend /app/frontend
COPY docker/start-fullstack.sh /start-fullstack.sh

RUN chmod +x /start-fullstack.sh

EXPOSE 8001 3003

ENTRYPOINT ["/start-fullstack.sh"]
