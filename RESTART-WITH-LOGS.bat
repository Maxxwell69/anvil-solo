@echo off
echo.
echo ========================================
echo   RESTARTING ANVIL WITH DETAILED LOGS
echo ========================================
echo.

echo Stopping any running instances...
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting Anvil with enhanced error logging...
echo.
echo WATCH FOR DETAILED ERROR MESSAGES!
echo.

cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
node start-app.js

echo.
pause




