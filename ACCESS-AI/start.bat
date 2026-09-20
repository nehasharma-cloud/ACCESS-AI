@echo off

title ACCESS-AI

cd /d "%~dp0"

echo ========================================
echo        ACCESS-AI
echo   AI Accessibility Assistant
echo ========================================
echo.

echo Starting ACCESS-AI...
echo.

call .venv\Scripts\activate

python run.py

pause