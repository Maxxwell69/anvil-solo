@echo off
REM Fix Jupiter DNS by adding to Windows hosts file
REM MUST RUN AS ADMINISTRATOR

echo.
echo ========================================
echo   JUPITER DNS FIX - HOSTS FILE METHOD
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: This script requires Administrator privileges
    echo.
    echo RIGHT-CLICK THIS FILE and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Adding Jupiter API to hosts file...
echo.

REM Backup hosts file first
copy C:\Windows\System32\drivers\etc\hosts C:\Windows\System32\drivers\etc\hosts.backup >nul 2>&1
echo ✅ Hosts file backed up to hosts.backup

REM Add Jupiter entries
echo # Jupiter API - Added by Anvil for DNS resolution >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 quote-api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 lite-api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo.

echo ✅ Added Jupiter API entries to hosts file
echo.

echo Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
echo ✅ DNS cache flushed
echo.

echo Testing connection...
ping quote-api.jup.ag -n 2

echo.
echo ========================================
echo   FIX COMPLETE!
echo ========================================
echo.
echo Jupiter API should now work!
echo.
echo To test:
echo 1. Close and restart Anvil app
echo 2. Try your DCA order again
echo.
echo To revert (if needed):
echo 1. Open: C:\Windows\System32\drivers\etc\hosts
echo 2. Remove lines with "quote-api.jup.ag"
echo 3. Or restore from hosts.backup
echo.

pause




