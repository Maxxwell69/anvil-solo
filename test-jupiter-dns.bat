@echo off
echo Testing Jupiter API connectivity...
echo.
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://quote-api.jup.ag/v6/health' -UseBasicParsing -TimeoutSec 10; Write-Host 'SUCCESS! Jupiter API is reachable' -ForegroundColor Green; Write-Host 'Status Code:' $response.StatusCode } catch { Write-Host 'FAILED! Cannot reach Jupiter API' -ForegroundColor Red; Write-Host 'Error:' $_.Exception.Message }"
echo.
pause







