@echo off
echo ========================================
echo   FIX FEE DATABASE - Manual Update
echo ========================================
echo.
echo This will add fee settings to your Anvil Solo database.
echo.
echo Fee Settings:
echo   - Fee Enabled: TRUE
echo   - Fee Percentage: 0.5%%
echo   - Fee Wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
echo.
echo ========================================
echo.

REM Find the database file
set DB_PATH=%USERPROFILE%\.anvil\anvil-solo.db

echo Checking for database...
if not exist "%DB_PATH%" (
    echo ERROR: Database not found at %DB_PATH%
    echo.
    echo Please make sure Anvil Solo has been run at least once.
    pause
    exit /b 1
)

echo Found database: %DB_PATH%
echo.

REM Close Anvil Solo if running
echo IMPORTANT: Please close Anvil Solo before continuing.
echo.
pause

REM Use PowerShell and better-sqlite3 to update the database
echo.
echo Updating database with fee settings...
echo.

node -e "const db = require('better-sqlite3')('%DB_PATH%'); try { db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_enabled', 'true'); console.log('  ✅ Added fee_enabled = true'); } catch(e) { console.log('  ❌ Error:', e.message); } try { db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_percentage', '0.5'); console.log('  ✅ Added fee_percentage = 0.5'); } catch(e) { console.log('  ❌ Error:', e.message); } try { db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'); console.log('  ✅ Added fee_wallet_address'); } catch(e) { console.log('  ❌ Error:', e.message); } const check = db.prepare('SELECT key, value FROM settings WHERE key LIKE ?').all('fee%%'); console.log(''); console.log('Current Fee Settings:'); check.forEach(s => console.log('  -', s.key, '=', s.value)); db.close();"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to update database
    echo.
    echo Try the manual DevTools fix instead:
    echo 1. Open Anvil Solo
    echo 2. Press F12
    echo 3. Go to Console tab
    echo 4. Type: window.electron.fees.updateConfig({feeEnabled: true, feePercentage: 0.5, feeWalletAddress: '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'});
    echo 5. Press Enter
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ DATABASE UPDATED SUCCESSFULLY!
echo ========================================
echo.
echo Next Steps:
echo   1. Start Anvil Solo
echo   2. Check console (F12) for fee messages
echo   3. Make a test trade
echo   4. Check fee wallet on Solscan
echo.
echo Fee Wallet to Monitor:
echo   82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
echo.
pause

