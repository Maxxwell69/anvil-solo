@echo off
REM Quick launcher for Anvil with status checks
echo.
echo ========================================
echo   STARTING ANVIL TRADING BOT
echo ========================================
echo.

cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

echo [1/3] Checking if build exists...
if not exist "dist\main\main.js" (
    echo ⚠️  Build not found. Building now...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
    echo ✅ Build complete
) else (
    echo ✅ Build exists
)
echo.

echo [2/3] Testing Jupiter API connectivity...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://quote-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop; Write-Host '✅ Jupiter API reachable' -ForegroundColor Green } catch { Write-Host '⚠️  Jupiter API not reachable (app will try fallbacks)' -ForegroundColor Yellow }"
echo.

echo [3/3] Starting Anvil...
echo.
echo ========================================
echo   APP IS STARTING...
echo   Watch for errors below
echo ========================================
echo.

node start-app.js




