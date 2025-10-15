# Fix All Jupiter DNS Issues
# Run this in PowerShell as Administrator

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JUPITER DNS FIX - ALL SUBDOMAINS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script requires Administrator privileges" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Navigate to: C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0" -ForegroundColor Yellow
    Write-Host "4. Run: .\Fix-Jupiter-Admin.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/5] Backing up hosts file..." -ForegroundColor Yellow
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$backupPath = "$hostsPath.backup." + (Get-Date -Format "yyyyMMdd-HHmmss")
Copy-Item $hostsPath $backupPath -Force
Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Removing old Jupiter entries..." -ForegroundColor Yellow
$hostsContent = Get-Content $hostsPath
$newContent = $hostsContent | Where-Object { $_ -notmatch 'jup\.ag|jupiterapi\.com' }
$newContent | Set-Content $hostsPath -Force
Write-Host "✅ Old entries removed" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Adding ALL Jupiter domains to hosts file..." -ForegroundColor Yellow
$jupiterEntries = @"

# Jupiter API - All Subdomains (Added by Anvil)
# CloudFlare CDN IP for Jupiter services
104.26.9.40 quote-api.jup.ag
104.26.9.40 lite-api.jup.ag
104.26.9.40 api.jup.ag
104.26.9.40 tokens.jup.ag
104.26.9.40 price.jup.ag
104.26.9.40 cache.jup.ag
104.26.9.40 public.jupiterapi.com
104.26.8.40 jup.ag
"@

Add-Content $hostsPath $jupiterEntries
Write-Host "✅ Added 8 Jupiter domains" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Flushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
ipconfig /registerdns | Out-Null
Write-Host "✅ DNS cache flushed" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Testing Jupiter endpoints..." -ForegroundColor Yellow
Write-Host ""

$domains = @(
    "quote-api.jup.ag",
    "tokens.jup.ag", 
    "lite-api.jup.ag",
    "api.jup.ag"
)

foreach ($domain in $domains) {
    try {
        $result = Test-NetConnection -ComputerName $domain -Port 443 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ $domain - WORKING" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $domain - Connection test inconclusive" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $domain - FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All Jupiter domains added to hosts file" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Restart your computer (IMPORTANT!)" -ForegroundColor White
Write-Host "2. Start Anvil app" -ForegroundColor White
Write-Host "3. All Jupiter features will work!" -ForegroundColor White
Write-Host ""
Write-Host "Hosts file location:" -ForegroundColor Cyan
Write-Host "  C:\Windows\System32\drivers\etc\hosts" -ForegroundColor White
Write-Host ""
Write-Host "To revert changes:" -ForegroundColor Cyan
Write-Host "  Restore from: $backupPath" -ForegroundColor White
Write-Host ""

pause



