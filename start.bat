@echo off
REM SQLVault — Quick-Start Script for Windows
REM Run from the repo root: .\start.bat

echo ============================================================
echo   SQLVault — Database Version Control System
echo ============================================================
echo.

REM ── Backend ──────────────────────────────────────────────────
IF NOT EXIST "SQLVault\backend\.env" (
    echo [!] No .env found. Copying .env.example → SQLVault\backend\.env
    copy "SQLVault\backend\.env.example" "SQLVault\backend\.env"
    echo     ^> Please open SQLVault\backend\.env and fill in your DATABASE_URL.
    echo.
)

echo [1/3] Installing backend dependencies...
cd SQLVault\backend
call npm install --silent
echo       Done.
echo.

echo [2/3] Starting backend API server on port 5000...
start "SQLVault Backend" cmd /k "node src\server.js"
echo       Waiting 2 seconds for server to initialize...
timeout /t 2 /nobreak > nul
echo.

REM ── Frontend ─────────────────────────────────────────────────
cd ..\frontend
echo [3/3] Installing frontend dependencies and starting Vite dev server on port 3000...
call npm install --silent
start "SQLVault Frontend" cmd /k "npm run dev"
echo.

echo ============================================================
echo   SQLVault is starting:
echo     Backend  → http://localhost:5000/api/health
echo     Frontend → http://localhost:3000
echo ============================================================
echo.
pause
