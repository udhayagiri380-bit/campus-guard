@echo off
title KSR CampusGuard - Push to GitHub
color 0B
echo ======================================================================
echo           KSR CampusGuard - Git Push to GitHub Utility
echo ======================================================================
echo.
cd /d "%~dp0"
set "PATH=%~dp0bin\git\cmd;%PATH%"

echo [*] Remote Repository: https://github.com/udhayagiri380-bit/campus-guard.git
echo [*] Current Branch: main
echo.
echo Choose an authentication method:
echo   [1] Interactive Web Browser Sign-In (Recommended - 1-Click)
echo   [2] Paste GitHub Personal Access Token (PAT)
echo.
set "choice=1"
set "token="
set /p choice="Enter option (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    echo [TIP] Generate a PAT at: https://github.com/settings/tokens
    echo       Scope required: 'repo' (Full control of private repositories)
    echo.
    set /p token="Paste your GitHub Personal Access Token: "
    if not defined token (
        echo [ERROR] No token entered!
        pause
        exit /b 1
    )
    echo [*] Pushing with token to https://github.com/udhayagiri380-bit/campus-guard.git ...
    call "%~dp0bin\git\cmd\git.exe" push https://udhayagiri380-bit:%token%@github.com/udhayagiri380-bit/campus-guard.git main:main -u
) else (
    echo [*] Starting Git Push...
    echo [*] A browser window or login prompt may open. Sign in to authorize GitHub.
    echo.
    call "%~dp0bin\git\cmd\git.exe" push -u origin main
)

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ======================================================================
    echo   SUCCESS! All project files are published to GitHub:
    echo   https://github.com/udhayagiri380-bit/campus-guard
    echo ======================================================================
) else (
    color 0C
    echo ======================================================================
    echo   PUSH FAILED: Check your login credentials or Personal Access Token.
    echo ======================================================================
)
echo.
pause
