@echo off
echo.
echo ========================================
echo   RESTARTING ANVIL WITH UNLOCK SCREEN
echo ========================================
echo.

echo Stopping any running instances...
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting Anvil...
echo.

cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
start /B node start-app.js

echo.
echo ========================================
echo   APP STARTED!
echo ========================================
echo.
echo You should now see the UNLOCK SCREEN:
echo.
echo    🔒 Anvil Solo
echo    Unlock your wallet to continue
echo.
echo    [Enter master password]
echo    [Unlock Wallet]
echo.
echo Enter the password you used when you
echo IMPORTED your wallet.
echo.
echo ========================================
echo.
pause



