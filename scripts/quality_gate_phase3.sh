#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Phase 3: frontend build"
cd "$ROOT_DIR/frontend"
npm run build

echo "==> Phase 3: backend smoke quality checks"
cd "$ROOT_DIR"
python3 backend/scripts/quality_gate_smoke.py "$@"

echo "==> Phase 3 quality gate passed"
