@echo off
REM Complete Jupiter DNS Fix - All Subdomains
REM MUST RUN AS ADMINISTRATOR

echo.
echo ========================================
echo   COMPLETE JUPITER DNS FIX
echo   Fixing ALL Jupiter Subdomains
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

echo [1/4] Backing up hosts file...
copy C:\Windows\System32\drivers\etc\hosts C:\Windows\System32\drivers\etc\hosts.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% >nul 2>&1
echo ✅ Backup created

echo.
echo [2/4] Adding ALL Jupiter domains to hosts file...

REM Remove any existing Jupiter entries first
powershell -Command "(Get-Content C:\Windows\System32\drivers\etc\hosts) | Where-Object {$_ -notmatch 'jup.ag'} | Set-Content C:\Windows\System32\drivers\etc\hosts"

REM Add all Jupiter subdomains
echo. >> C:\Windows\System32\drivers\etc\hosts
echo # Jupiter API - All Subdomains (Added by Anvil) >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 quote-api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 lite-api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 api.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 tokens.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 public.jupiterapi.com >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 price.jup.ag >> C:\Windows\System32\drivers\etc\hosts
echo 104.26.9.40 cache.jup.ag >> C:\Windows\System32\drivers\etc\hosts

echo ✅ Added 7 Jupiter domains

echo.
echo [3/4] Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
ipconfig /registerdns >nul 2>&1
echo ✅ DNS cache flushed

echo.
echo [4/4] Testing all Jupiter endpoints...
echo.

echo Testing quote-api.jup.ag...
ping quote-api.jup.ag -n 1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ quote-api.jup.ag - WORKING
) else (
    echo ❌ quote-api.jup.ag - FAILED
)

echo Testing tokens.jup.ag...
ping tokens.jup.ag -n 1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ tokens.jup.ag - WORKING
) else (
    echo ❌ tokens.jup.ag - FAILED
)

echo Testing lite-api.jup.ag...
ping lite-api.jup.ag -n 1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ lite-api.jup.ag - WORKING
) else (
    echo ❌ lite-api.jup.ag - FAILED
)

echo Testing api.jup.ag...
ping api.jup.ag -n 1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ api.jup.ag - WORKING
) else (
    echo ❌ api.jup.ag - FAILED
)

echo.
echo ========================================
echo   FIX COMPLETE!
echo ========================================
echo.
echo All Jupiter subdomains added to hosts file:
echo   ✅ quote-api.jup.ag (quote API)
echo   ✅ tokens.jup.ag (token list)
echo   ✅ lite-api.jup.ag (lite API)
echo   ✅ api.jup.ag (standard API)
echo   ✅ public.jupiterapi.com (public mirror)
echo   ✅ price.jup.ag (price API)
echo   ✅ cache.jup.ag (cache API)
echo.
echo IMPORTANT: Restart your computer for all changes to take effect!
echo.
echo To view hosts file:
echo   notepad C:\Windows\System32\drivers\etc\hosts
echo.
echo To revert changes:
echo   1. Open hosts file as Administrator
echo   2. Remove lines containing "jup.ag"
echo   3. Or restore from backup file
echo.

pause




