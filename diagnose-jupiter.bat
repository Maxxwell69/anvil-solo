@echo off
REM ============================================
REM Jupiter API Diagnostic Tool for Home Networks
REM ============================================
echo.
echo ========================================
echo   JUPITER API CONNECTIVITY DIAGNOSTIC
echo ========================================
echo.

REM Check basic internet connectivity
echo [1/8] Checking basic internet connectivity...
ping -n 2 8.8.8.8 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAILED: No internet connection detected
    echo    Solution: Check your network connection
    goto :end
) else (
    echo ✅ Internet connection OK
)
echo.

REM Check DNS resolution
echo [2/8] Testing DNS resolution...
nslookup quote-api.jup.ag >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ WARNING: DNS resolution failed for quote-api.jup.ag
    echo    This is the PRIMARY issue!
    echo    Solution: Flush DNS cache (see below)
) else (
    echo ✅ DNS resolution OK
)
echo.

REM Flush DNS cache
echo [3/8] Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
echo ✅ DNS cache flushed
echo.

REM Test each Jupiter endpoint
echo [4/8] Testing Jupiter API endpoints...
echo.

echo Testing: https://quote-api.jup.ag/v6/health
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://quote-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop; Write-Host '  ✅ ENDPOINT 1: quote-api.jup.ag - WORKING (Status:' $response.StatusCode ')' -ForegroundColor Green } catch { Write-Host '  ❌ ENDPOINT 1: quote-api.jup.ag - FAILED' -ForegroundColor Red; Write-Host '     Error:' $_.Exception.Message -ForegroundColor Yellow }"
echo.

echo Testing: https://api.jup.ag/v6/health  
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop; Write-Host '  ✅ ENDPOINT 2: api.jup.ag - WORKING (Status:' $response.StatusCode ')' -ForegroundColor Green } catch { Write-Host '  ❌ ENDPOINT 2: api.jup.ag - FAILED' -ForegroundColor Red; Write-Host '     Error:' $_.Exception.Message -ForegroundColor Yellow }"
echo.

echo Testing: https://lite-api.jup.ag/v6/health
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://lite-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop; Write-Host '  ✅ ENDPOINT 3: lite-api.jup.ag - WORKING (Status:' $response.StatusCode ')' -ForegroundColor Green } catch { Write-Host '  ❌ ENDPOINT 3: lite-api.jup.ag - FAILED' -ForegroundColor Red; Write-Host '     Error:' $_.Exception.Message -ForegroundColor Yellow }"
echo.

REM Test actual quote API
echo [5/8] Testing actual quote request...
powershell -Command "$url = 'https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000'; try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop; $data = $response.Content | ConvertFrom-Json; Write-Host '  ✅ Quote API working! Got quote:' $data.outAmount -ForegroundColor Green } catch { Write-Host '  ❌ Quote API failed' -ForegroundColor Red; Write-Host '     Error:' $_.Exception.Message -ForegroundColor Yellow }"
echo.

REM Check firewall
echo [6/8] Checking Windows Firewall status...
powershell -Command "$firewall = Get-NetFirewallProfile -Profile Domain,Public,Private | Where-Object {$_.Enabled -eq $true}; if ($firewall) { Write-Host '  ℹ️  Firewall is ENABLED' -ForegroundColor Yellow; Write-Host '     If Jupiter fails, try temporarily disabling firewall' } else { Write-Host '  ✅ Firewall is disabled' -ForegroundColor Green }"
echo.

REM Check proxy settings
echo [7/8] Checking proxy settings...
powershell -Command "$proxy = Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' | Select-Object ProxyEnable, ProxyServer; if ($proxy.ProxyEnable -eq 1) { Write-Host '  ⚠️  Proxy is ENABLED:' $proxy.ProxyServer -ForegroundColor Yellow; Write-Host '     This may interfere with Jupiter API' } else { Write-Host '  ✅ No proxy configured' -ForegroundColor Green }"
echo.

REM Network adapter info
echo [8/8] Network adapter information...
powershell -Command "$adapter = Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object -First 1; Write-Host '  Adapter:' $adapter.Name; Write-Host '  Status:' $adapter.Status; $ip = Get-NetIPAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4 | Select-Object -First 1; Write-Host '  IP Address:' $ip.IPAddress"
echo.

echo ========================================
echo   DIAGNOSTIC COMPLETE
echo ========================================
echo.
echo SOLUTIONS FOR COMMON ISSUES:
echo.
echo 1. DNS FAILURES:
echo    - Run: ipconfig /flushdns
echo    - Change DNS to Google: 8.8.8.8, 8.8.4.4
echo    - Or Cloudflare: 1.1.1.1, 1.0.0.1
echo.
echo 2. FIREWALL BLOCKING:
echo    - Temporarily disable Windows Firewall
echo    - Add exception for your trading app
echo.
echo 3. ISP BLOCKING:
echo    - Some ISPs block crypto APIs
echo    - Try using a VPN
echo    - Or mobile hotspot
echo.
echo 4. ALL ENDPOINTS FAIL:
echo    - Jupiter may be down (rare)
echo    - Wait 5-10 minutes and retry
echo    - App will auto-retry with fallbacks
echo.
echo 5. ROUTER ISSUES:
echo    - Restart your router
echo    - Update router firmware
echo    - Check QoS settings
echo.

:end
echo.
pause






