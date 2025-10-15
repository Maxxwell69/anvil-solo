@echo off
REM ============================================
REM Jupiter DNS Fix Tool for Home Networks
REM ============================================
echo.
echo ========================================
echo   JUPITER DNS FIX TOOL
echo ========================================
echo.
echo This tool will fix common DNS issues that prevent
echo home computers from connecting to Jupiter API
echo.

REM Request admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  This script requires Administrator privileges
    echo    Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [1/6] Flushing DNS cache...
ipconfig /flushdns
echo ✅ DNS cache flushed
echo.

echo [2/6] Clearing ARP cache...
arp -d *
echo ✅ ARP cache cleared
echo.

echo [3/6] Resetting Winsock catalog...
netsh winsock reset
echo ✅ Winsock reset
echo.

echo [4/6] Resetting TCP/IP stack...
netsh int ip reset
echo ✅ TCP/IP reset
echo.

echo [5/6] Renewing IP configuration...
ipconfig /release >nul 2>&1
ipconfig /renew
echo ✅ IP configuration renewed
echo.

echo [6/6] Setting up alternative DNS servers...
echo.
echo Choose your preferred DNS provider:
echo.
echo 1. Google DNS (8.8.8.8 / 8.8.4.4) - Fast and reliable
echo 2. Cloudflare DNS (1.1.1.1 / 1.0.0.1) - Privacy-focused
echo 3. OpenDNS (208.67.222.222 / 208.67.220.220) - Family-safe
echo 4. Quad9 DNS (9.9.9.9 / 149.112.112.112) - Security-focused
echo 5. Skip DNS change
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    set DNS1=8.8.8.8
    set DNS2=8.8.4.4
    set DNS_NAME=Google DNS
) else if "%choice%"=="2" (
    set DNS1=1.1.1.1
    set DNS2=1.0.0.1
    set DNS_NAME=Cloudflare DNS
) else if "%choice%"=="3" (
    set DNS1=208.67.222.222
    set DNS2=208.67.220.220
    set DNS_NAME=OpenDNS
) else if "%choice%"=="4" (
    set DNS1=9.9.9.9
    set DNS2=149.112.112.112
    set DNS_NAME=Quad9 DNS
) else (
    echo Skipping DNS change...
    goto :test
)

REM Get active network adapter
for /f "tokens=3*" %%i in ('netsh interface show interface ^| findstr "Connected"') do set ADAPTER=%%j

echo.
echo Setting %DNS_NAME% on adapter: %ADAPTER%
netsh interface ip set dns "%ADAPTER%" static %DNS1% primary
netsh interface ip add dns "%ADAPTER%" %DNS2% index=2
echo ✅ DNS servers configured
echo.

:test
echo ========================================
echo   TESTING JUPITER CONNECTIVITY
echo ========================================
echo.

echo Testing DNS resolution...
nslookup quote-api.jup.ag
echo.

echo Testing Jupiter API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://quote-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10; Write-Host '✅ SUCCESS! Jupiter API is now reachable!' -ForegroundColor Green } catch { Write-Host '❌ Still having issues. Try these:' -ForegroundColor Red; Write-Host '   1. Restart your computer' -ForegroundColor Yellow; Write-Host '   2. Restart your router' -ForegroundColor Yellow; Write-Host '   3. Try a VPN' -ForegroundColor Yellow; Write-Host '   4. Check if ISP is blocking crypto sites' -ForegroundColor Yellow }"
echo.

echo ========================================
echo   FIX COMPLETE
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Restart your computer for all changes to take effect
echo 2. Try running the app again
echo 3. If still not working, run: diagnose-jupiter.bat
echo.
echo REVERT CHANGES (if needed):
echo 1. Open Network Connections
echo 2. Right-click your adapter → Properties
echo 3. Select IPv4 → Properties
echo 4. Select "Obtain DNS server automatically"
echo.

pause





