@echo off
echo ========================================================
echo        Starting PRAMAAN Web Application
echo ========================================================
echo.

echo 1. Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "PRAMAAN Backend (FastAPI)" cmd /k "backend\venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo 2. Starting Next.js Frontend on http://localhost:3000 ...
cd frontend
start "PRAMAAN Frontend (Next.js)" cmd /k "npm run dev"

timeout /t 3 >nul

echo 3. Opening browser...
start http://localhost:3000

echo.
echo ========================================================
echo PRAMAAN is now running!
echo - Frontend: http://localhost:3000
echo - Backend API: http://127.0.0.1:8000/docs
echo ========================================================
pause
