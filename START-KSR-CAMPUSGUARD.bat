@echo off
setlocal enabledelayedexpansion
title KSR Institutions — CampusGuard Emergency Response System
cd /d "%~dp0"

echo.
echo ==============================================================
echo    KSR INSTITUTIONS — CAMPUSGUARD EMERGENCY LAUNCHER
echo ==============================================================
echo.

set "NODE_EXE="

:: 1. Check system PATH
where node >nul 2>nul
if %errorlevel% equ 0 (
  set "NODE_EXE=node"
  goto :FOUND_NODE
)

:: 2. Check local ms-playwright node
if exist "C:\Users\Udhaya K\AppData\Local\ms-playwright-go\1.57.0\node.exe" (
  set "NODE_EXE=C:\Users\Udhaya K\AppData\Local\ms-playwright-go\1.57.0\node.exe"
  goto :FOUND_NODE
)

:: 3. Check standard Program Files
if exist "C:\Program Files\nodejs\node.exe" (
  set "NODE_EXE=C:\Program Files\nodejs\node.exe"
  goto :FOUND_NODE
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
  set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
  goto :FOUND_NODE
)

:: 4. Check Antigravity IDE Electron as Node
if exist "d:\Antigravity IDE\Antigravity IDE.exe" (
  set "ELECTRON_RUN_AS_NODE=1"
  set "NODE_EXE=d:\Antigravity IDE\Antigravity IDE.exe"
  goto :FOUND_NODE
)

echo [ERROR] Node.js was not found on your system.
echo Please install Node.js LTS from https://nodejs.org
echo Then double-click this file again.
pause
exit /b 1

:FOUND_NODE
echo [OK] Using Node runtime: "!NODE_EXE!"
echo [OK] Zero external npm packages required (pure built-in SQLite + HTTP).
echo.
echo Starting KSR CampusGuard Server...
echo.

:: Launch browsers after 1.5 seconds
start "" powershell -Command "Start-Sleep -Milliseconds 1500; Start-Process 'http://localhost:5000/'; Start-Process 'http://localhost:5000/ambulance'"

"!NODE_EXE!" server.js
pause
