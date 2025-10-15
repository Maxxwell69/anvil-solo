@echo off
REM Quick DNS Change to Google DNS
REM Must run as Administrator

echo.
echo ========================================
echo   QUICK DNS FIX FOR JUPITER API
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: This script requires Administrator privileges
    echo.
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Detecting network adapter...
echo.

REM Get the active network adapter name
for /f "tokens=3*" %%i in ('netsh interface show interface ^| findstr "Connected"') do set ADAPTER=%%j

if "%ADAPTER%"=="" (
    echo ❌ No active network adapter found
    pause
    exit /b 1
)

echo Found adapter: %ADAPTER%
echo.

echo Setting Google DNS servers...
netsh interface ip set dns "%ADAPTER%" static 8.8.8.8 primary
netsh interface ip add dns "%ADAPTER%" 8.8.4.4 index=2

echo.
echo ✅ DNS servers updated:
echo    Primary:   8.8.8.8 (Google)
echo    Secondary: 8.8.4.4 (Google)
echo.

echo Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
echo ✅ DNS cache flushed
echo.

echo Testing Jupiter API...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://quote-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10; Write-Host '✅ SUCCESS! Jupiter API is reachable!' -ForegroundColor Green } catch { Write-Host '❌ Still cannot reach Jupiter API' -ForegroundColor Red; Write-Host '   Error:' $_.Exception.Message -ForegroundColor Yellow; Write-Host '' ; Write-Host '   Try:' -ForegroundColor Cyan; Write-Host '   1. Restart your computer' -ForegroundColor Yellow; Write-Host '   2. Check firewall settings' -ForegroundColor Yellow; Write-Host '   3. Try a VPN' -ForegroundColor Yellow }"

echo.
echo ========================================
echo   COMPLETE
echo ========================================
echo.
echo To revert to automatic DNS:
echo 1. Network Settings → Change adapter options
echo 2. Right-click your adapter → Properties
echo 3. IPv4 → Properties
echo 4. Select "Obtain DNS server address automatically"
echo.
pause



