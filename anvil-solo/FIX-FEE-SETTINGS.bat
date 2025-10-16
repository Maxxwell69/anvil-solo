@echo off
echo ========================================
echo Anvil Solo - Fix Fee Settings
echo ========================================
echo.

echo This script will add missing fee settings to your database.
echo.

set /p CONFIRM="Continue? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo [1/3] Finding database...
set DB_PATH=%USERPROFILE%\.anvil\anvil-solo.db

if not exist "%DB_PATH%" (
    echo ERROR: Database not found at %DB_PATH%
    echo Please make sure Anvil Solo is installed and has been run at least once.
    pause
    exit /b
)

echo Database found: %DB_PATH%

echo.
echo [2/3] Adding fee settings...

REM Create a temporary SQL script
echo -- Add fee settings to database > temp_fee_fix.sql
echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_enabled', 'true'); >> temp_fee_fix.sql
echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_percentage', '0.5'); >> temp_fee_fix.sql
echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'); >> temp_fee_fix.sql

REM Execute the SQL script using sqlite3
sqlite3 "%DB_PATH%" < temp_fee_fix.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Fee settings added successfully!
) else (
    echo ❌ Failed to add fee settings. Make sure sqlite3 is installed.
    echo.
    echo Alternative: Download SQLite Browser from https://sqlitebrowser.org/
    echo Open %DB_PATH%
    echo Go to Execute SQL tab
    echo Run these commands:
    echo.
    echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_enabled', 'true');
    echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_percentage', '0.5');
    echo INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
    echo.
    pause
    exit /b
)

echo.
echo [3/3] Cleaning up...
del temp_fee_fix.sql

echo.
echo ========================================
echo ✅ FEE SETTINGS FIXED!
echo ========================================
echo.
echo Next steps:
echo 1. Close Anvil Solo completely
echo 2. Restart Anvil Solo
echo 3. Create a test trade (0.01 SOL)
echo 4. Check console for fee collection logs
echo.
echo You should now see:
echo - Migration logs at startup
echo - Fee collection logs during trades
echo - Fees transferred to admin wallet
echo.
pause
