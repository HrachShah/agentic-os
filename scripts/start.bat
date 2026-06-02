@echo off
title Agentic OS

echo.
echo  ============================================
echo    Agentic OS - Starting...
echo  ============================================
echo.

:: Check if node is available
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found. Please install Node.js first.
  pause
  exit /b 1
)

:: Install backend deps if needed
if not exist "backend\node_modules" (
  echo [SETUP] Installing backend dependencies...
  cd backend && npm install && cd ..
)

:: Build dashboard if dist doesn't exist
if not exist "dashboard\dist" (
  echo [SETUP] Installing dashboard dependencies...
  cd dashboard && npm install
  echo [SETUP] Building dashboard...
  npm run build && cd ..
)

:: Set env vars
set CLAUDE_HOME=%USERPROFILE%\.claude
set WORKSPACE=%USERPROFILE%
set PORT=3000

echo [INFO] Claude Home: %CLAUDE_HOME%
echo [INFO] Workspace:   %WORKSPACE%
echo [INFO] Port:        %PORT%
echo.

:: Start backend
echo [START] Starting Agentic OS on http://localhost:%PORT%
echo.
start "" http://localhost:%PORT%
node backend\server.js
