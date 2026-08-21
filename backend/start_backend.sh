#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    echo "Creating python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/playwright install chromium
fi

echo "Starting FastAPI backend server on http://localhost:8000..."
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
