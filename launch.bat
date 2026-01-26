@echo off
title LifeRPG Launcher
cd /d "%~dp0"

echo Starting LifeRPG...
start "LifeRPG Server" cmd /k "npm start"

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Opening browser...
start "" "http://localhost:5000"

echo.
echo LifeRPG is running. Close the server window to stop the app.
