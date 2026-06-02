@echo off
title Agentic OS - Dev Mode

echo.
echo  ============================================
echo    Agentic OS - Development Mode
echo  ============================================
echo.

:: Install deps if needed
if not exist "backend\node_modules" (
  cd backend && npm install && cd ..
)
if not exist "dashboard\node_modules" (
  cd dashboard && npm install && cd ..
)

set CLAUDE_HOME=%USERPROFILE%\.claude
set WORKSPACE=%USERPROFILE%
set PORT=3000

echo [INFO] Backend:   http://localhost:3000
echo [INFO] Dashboard: http://localhost:5173
echo.

:: Start backend in a new window
start "Agentic OS Backend" cmd /k "cd /d %~dp0.. && node backend\server.js"

:: Start dashboard dev server
echo [START] Starting dashboard dev server...
cd dashboard && npm run dev
