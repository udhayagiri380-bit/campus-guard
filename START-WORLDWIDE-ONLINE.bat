@echo off
setlocal enabledelayedexpansion
title KSR Institutions - CampusGuard Worldwide Online Launcher
cd /d "%~dp0"

echo.
echo ==============================================================
echo   KSR CAMPUSGUARD - WORLDWIDE ONLINE LAUNCHER (ANY NETWORK)
echo ==============================================================
echo.

:: 1. Find Node
set "NODE_EXE="
where node >nul 2>nul && set "NODE_EXE=node"
if not defined NODE_EXE if exist "C:\Users\Udhaya K\AppData\Local\ms-playwright-go\1.57.0\node.exe" set "NODE_EXE=C:\Users\Udhaya K\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"

:: 2. Check if server already running on port 5000
netstat -ano | findstr /R ":5000.*LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/3] Starting Local Server on port 5000...
    start "KSR Server" /b "!NODE_EXE!" server.js
    timeout /t 2 /nobreak >nul
) else (
    echo [1/3] Server is already running on port 5000.
)

:: 3. Check cloudflared binary
if not exist "bin\cloudflared.exe" (
    echo [ERROR] bin\cloudflared.exe not found!
    pause
    exit /b 1
)

echo [2/3] Connecting to Cloudflare Global Edge Network...
echo [INFO] Generating secure HTTPS tunnel (works on 4G, 5G, and any Wi-Fi worldwide)...
echo.
echo ==============================================================
echo Look for the URL ending in .trycloudflare.com below:
echo Share that link with ANY student, phone, or ambulance driver!
echo ==============================================================
echo.

bin\cloudflared.exe tunnel --url http://localhost:5000
pause