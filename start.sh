#!/usr/bin/env bash
# SQLVault — Quick-Start Script for macOS / Linux
# Usage: chmod +x start.sh && ./start.sh

set -e

echo "============================================================"
echo "  SQLVault — Database Version Control System"
echo "============================================================"
echo

# ── Backend ───────────────────────────────────────────────────
if [ ! -f "SQLVault/backend/.env" ]; then
  echo "[!] No .env found. Copying .env.example → SQLVault/backend/.env"
  cp SQLVault/backend/.env.example SQLVault/backend/.env
  echo "    > Please open SQLVault/backend/.env and fill in your DATABASE_URL."
  echo
fi

echo "[1/3] Installing backend dependencies..."
(cd SQLVault/backend && npm install --silent)
echo "      Done."
echo

echo "[2/3] Starting backend API server on port 5000..."
(cd SQLVault/backend && node src/server.js &)
sleep 2
echo "      Backend running at http://localhost:5000/api/health"
echo

echo "[3/3] Installing frontend dependencies and starting Vite dev server..."
(cd SQLVault/frontend && npm install --silent && npm run dev &)
sleep 2
echo "      Frontend running at http://localhost:3000"
echo

echo "============================================================"
echo "  SQLVault is running:"
echo "    Backend  → http://localhost:5000/api/health"
echo "    Frontend → http://localhost:3000"
echo "============================================================"
