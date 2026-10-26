@echo off
echo ==========================================================
echo          PRAMAAN Containerized Deployment Script
echo ==========================================================

REM Check Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please make sure Docker Desktop is installed and running.
    pause
    exit /b 1
)

REM Create .env if missing
if not exist .env (
    echo [+] Creating .env from .env.example...
    copy .env.example .env
)

set MODE=%1
if "%MODE%"=="prod" (
    echo [+] Deploying in PRODUCTION mode with Nginx on Port 80...
    docker compose -f docker-compose.prod.yml down --remove-orphans
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d
    echo.
    echo ==========================================================
    echo Deployment successful!
    echo Application: http://localhost (Port 80)
    echo API Docs:    http://localhost/docs
    echo ==========================================================
) else (
    echo [+] Deploying in STANDARD mode (Frontend: 3000, Backend: 8000)...
    docker compose down --remove-orphans
    docker compose build
    docker compose up -d
    echo.
    echo ==========================================================
    echo Deployment successful!
    echo Frontend: http://localhost:3000
    echo Backend:  http://localhost:8000
    echo API Docs: http://localhost:8000/docs
    echo ==========================================================
)

docker compose ps
pause
