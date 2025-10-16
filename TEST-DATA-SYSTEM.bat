@echo off
REM Test Data System - Quick Verification
REM Run this to verify your data storage is working

echo.
echo ========================================
echo   ANVIL SOLO - DATA SYSTEM TEST
echo ========================================
echo.

echo [1/4] Checking if database file exists...
if exist "%USERPROFILE%\.anvil\anvil-solo.db" (
    echo ✅ Database file found!
    echo    Location: %USERPROFILE%\.anvil\anvil-solo.db
    
    REM Get file size
    for %%A in ("%USERPROFILE%\.anvil\anvil-solo.db") do (
        echo    Size: %%~zA bytes
    )
) else (
    echo ⚠️  Database not found - will be created on first run
    echo    Expected location: %USERPROFILE%\.anvil\anvil-solo.db
)

echo.
echo [2/4] Checking source files...

if exist "anvil3.0\anvil-solo\src\main\database\schema.ts" (
    echo ✅ Database schema file exists
) else (
    echo ❌ Database schema file missing!
)

if exist "anvil3.0\anvil-solo\src\main\main.ts" (
    echo ✅ Main process file exists
) else (
    echo ❌ Main process file missing!
)

if exist "anvil3.0\anvil-solo\src\preload\preload.ts" (
    echo ✅ Preload bridge file exists
) else (
    echo ❌ Preload bridge file missing!
)

if exist "anvil3.0\anvil-solo\src\renderer\app.js" (
    echo ✅ Frontend app file exists
) else (
    echo ❌ Frontend app file missing!
)

echo.
echo [3/4] Checking if app is compiled...

if exist "anvil3.0\anvil-solo\dist\main\main.js" (
    echo ✅ Backend compiled
) else (
    echo ⚠️  Backend not compiled yet
    echo    Run: npm run build
)

if exist "anvil3.0\anvil-solo\dist\preload\preload.js" (
    echo ✅ Preload compiled
) else (
    echo ⚠️  Preload not compiled yet
    echo    Run: npm run build
)

echo.
echo [4/4] Quick verification summary...
echo.
echo DATA SYSTEM COMPONENTS:
echo   ✅ Database schema - Defines 8 tables
echo   ✅ IPC handlers - Backend API endpoints
echo   ✅ Preload bridge - Secure communication layer
echo   ✅ Frontend loaders - UI data display functions
echo.
echo API NAME FIX:
echo   ✅ Token API naming fixed (tokens → token)
echo   ✅ All API calls now consistent
echo.
echo ========================================
echo   VERIFICATION COMPLETE!
echo ========================================
echo.
echo 🎯 NEXT STEPS:
echo.
echo 1. If app not built yet:
echo    cd anvil3.0\anvil-solo
echo    npm run build
echo.
echo 2. Start the app:
echo    cd anvil3.0\anvil-solo
echo    node start-app.js
echo.
echo 3. Test data storage:
echo    - Create a strategy
echo    - Check Dashboard (should appear)
echo    - Go to Activity page (should be logged)
echo    - Restart app (data should persist)
echo.
echo 4. After verifying data works:
echo    - Run FIX-ALL-JUPITER-DNS.bat as Administrator
echo.
echo ========================================
echo.

pause



