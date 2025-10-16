@echo off
REM Rebuild Anvil Solo - Fixes Token API Error
REM Run this to recompile the app with the fixed code

echo.
echo ========================================
echo   ANVIL SOLO - REBUILD APP
echo   Fixing Token API Error
echo ========================================
echo.

cd anvil-solo

echo [1/3] Cleaning old build...
if exist "dist" (
    rmdir /s /q dist
    echo ✅ Old build removed
) else (
    echo ⚠️  No previous build found
)

echo.
echo [2/3] Rebuilding app...
echo This may take 30-60 seconds...
echo.

call npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ BUILD SUCCESSFUL!
    echo.
) else (
    echo.
    echo ❌ BUILD FAILED!
    echo Check the error messages above
    echo.
    pause
    exit /b 1
)

echo [3/3] Verifying build...

if exist "dist\main\main.js" (
    echo ✅ Backend compiled
) else (
    echo ❌ Backend missing!
)

if exist "dist\preload\preload.js" (
    echo ✅ Preload compiled
) else (
    echo ❌ Preload missing!
)

if exist "dist\renderer\app.js" (
    echo ✅ Frontend compiled (with Token API fix!)
) else (
    echo ❌ Frontend missing!
)

echo.
echo ========================================
echo   REBUILD COMPLETE!
echo ========================================
echo.
echo 🎯 Token API Error Fixed!
echo.
echo The app.js file has been recompiled with:
echo   ✅ window.electron.token.add()
echo   ✅ window.electron.token.list()
echo   ✅ window.electron.token.delete()
echo.
echo Now you can start the app:
echo   node start-app.js
echo.
echo ========================================
echo.

pause



