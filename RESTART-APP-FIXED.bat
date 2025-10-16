@echo off
REM Restart Anvil Solo with Token API Fix
REM The app has been rebuilt with the correct API calls

echo.
echo ========================================
echo   RESTARTING ANVIL SOLO
echo   Token API Error Fixed!
echo ========================================
echo.

cd anvil-solo

echo ✅ Build completed - app.js updated
echo ✅ Token API now using: window.electron.token.*
echo.
echo Starting app...
echo.

node start-app.js



