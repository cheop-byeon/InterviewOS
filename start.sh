#!/usr/bin/env bash
# ==============================================================================
# InterviewOS — All-in-One Bootstrap & Launch Script
# ==============================================================================
# Usage:
#   ./start.sh              # Install deps (if needed), init SQLite DB, and run dev server
#   ./start.sh --reset-db   # Re-create & re-seed SQLite database with latest catalog, then run
#   ./start.sh --prod       # Build production bundle and start production server
#   PORT=3001 ./start.sh    # Run on a custom port (default: 3000)
# ==============================================================================

set -euo pipefail

# Always run relative to the repository root where start.sh lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-3000}"
MODE="dev"
RESET_DB="false"

for arg in "$@"; do
  case "$arg" in
    --reset-db)
      RESET_DB="true"
      ;;
    --prod|--production)
      MODE="prod"
      ;;
    --help|-h)
      echo "Usage: ./start.sh [--reset-db] [--prod]"
      echo "  --reset-db   Delete existing data/interview_os.sqlite and re-seed fresh data"
      echo "  --prod       Run production build (npm run build && npm run start)"
      exit 0
      ;;
  esac
done

echo "=================================================================="
echo "  InterviewOS — Unified Career, ATS, System Design & AI Mock OS"
echo "=================================================================="

# 1. Verify Node.js & npm
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Please install Node.js v22.5+ and retry."
  exit 1
fi

NODE_VERSION="$(node -v)"
echo "[1/5] Node.js runtime detected: ${NODE_VERSION}"

if command -v python3 >/dev/null 2>&1; then
  PY_VERSION="$(python3 --version 2>&1)"
  echo "      Python 3 sandbox runtime: ${PY_VERSION}"
else
  echo "      [WARN] python3 not found on PATH (JS/TS code sandbox will still work)."
fi

# 2. Install npm dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "[2/5] Installing npm dependencies..."
  npm install
else
  echo "[2/5] Dependencies verified (node_modules present)."
fi

# 3. Prepare SQLite 3 (node:sqlite) database directory
mkdir -p "$SCRIPT_DIR/data"
if [ "$RESET_DB" = "true" ]; then
  echo "[3/5] Resetting SQLite 3 database (data/interview_os.sqlite)..."
  rm -f "$SCRIPT_DIR/data/interview_os.sqlite" \
        "$SCRIPT_DIR/data/interview_os.sqlite-wal" \
        "$SCRIPT_DIR/data/interview_os.sqlite-shm"
else
  echo "[3/5] SQLite 3 WAL storage directory ready: data/interview_os.sqlite"
fi

# 4. Run quick TypeScript verification
echo "[4/5] Verifying TypeScript compilation..."
./node_modules/.bin/tsc -p tsconfig.json --noEmit
echo "      TypeScript check passed (0 errors)."

# 5. Launch InterviewOS Server
echo "[5/5] Starting InterviewOS (${MODE} mode) on http://localhost:${PORT} ..."
echo "------------------------------------------------------------------"
echo "  * Web Workspace:      http://localhost:${PORT}"
echo "  * SQLite REST API:    http://localhost:${PORT}/api/db"
echo "  * Chrome Extension:   ${SCRIPT_DIR}/chrome-extension (Load Unpacked)"
echo "------------------------------------------------------------------"

if [ "$MODE" = "prod" ]; then
  npm run build
  PORT="$PORT" npm run start
else
  PORT="$PORT" npm run dev
fi
