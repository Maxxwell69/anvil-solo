@echo off
echo.
echo ========================================
echo   Starting Anvil Solo Desktop App
echo ========================================
echo.

cd "%~dp0anvil-solo"

echo Checking for dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --ignore-scripts
)

echo Building application...
call npm run build

echo.
echo Starting Anvil Solo...
echo.
echo The app window should open shortly!
echo If you don't see it, check your taskbar.
echo.

call npm start

pause






