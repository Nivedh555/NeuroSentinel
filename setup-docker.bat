@echo off
REM Docker Setup Helper Script for NeuroSentinel (Windows)
REM This script copies .env.example files to .env for easier setup

echo NeuroSentinel Docker Setup Helper
echo ==================================
echo.

REM Create server .env
if not exist "server\.env" (
    echo Creating server\.env from template...
    copy server\.env.example server\.env
    echo. ✓ Created server\.env
    echo.   Please edit server\.env and add your API keys
) else (
    echo ✓ server\.env already exists
)

REM Create python-server .env
if not exist "python-server\.env" (
    echo Creating python-server\.env from template...
    copy python-server\.env.example python-server\.env
    echo. ✓ Created python-server\.env
    echo.   Please edit python-server\.env and add your API keys
) else (
    echo ✓ python-server\.env already exists
)

echo.
echo Next Steps:
echo 1. Edit server\.env and add your API keys
echo 2. Edit python-server\.env and add GROQ_API_KEY
echo 3. Run: docker-compose up --build
echo.
echo More help: Read DOCKER_SETUP.md
echo.
pause
