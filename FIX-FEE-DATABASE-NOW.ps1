# Fix Fee Database - Add Missing Settings
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX FEE DATABASE - Manual Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will add fee settings to your Anvil Solo database."
Write-Host ""
Write-Host "Fee Settings:" -ForegroundColor Yellow
Write-Host "  - Fee Enabled: TRUE"
Write-Host "  - Fee Percentage: 0.5%"
Write-Host "  - Fee Wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find database
$dbPath = Join-Path $env:USERPROFILE ".anvil\anvil-solo.db"

Write-Host "Checking for database..." -ForegroundColor Yellow
if (-not (Test-Path $dbPath)) {
    Write-Host "ERROR: Database not found at $dbPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure Anvil Solo has been run at least once." -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "Found database: $dbPath" -ForegroundColor Green
Write-Host ""

# Check if Anvil Solo is running
$anvilProcess = Get-Process -Name "Anvil Solo" -ErrorAction SilentlyContinue
if ($anvilProcess) {
    Write-Host "WARNING: Anvil Solo is currently running!" -ForegroundColor Red
    Write-Host "Please close Anvil Solo before continuing." -ForegroundColor Red
    Write-Host ""
    pause
}

Write-Host "Updating database with fee settings..." -ForegroundColor Yellow
Write-Host ""

# Change to anvil-solo directory to use node_modules
$anvilSoloPath = Join-Path $PSScriptRoot "anvil-solo"
Set-Location $anvilSoloPath

# Run Node.js script to update database
$nodeScript = @"
const db = require('better-sqlite3')('$($dbPath.Replace('\', '\\'))');

try {
  // Check current settings
  const currentSettings = db.prepare('SELECT key, value FROM settings WHERE key LIKE ?').all('fee%');
  console.log('📊 Current fee settings:');
  if (currentSettings.length === 0) {
    console.log('  ⚠️  NO FEE SETTINGS FOUND!');
  } else {
    currentSettings.forEach(s => console.log('  -', s.key, '=', s.value));
  }
  console.log('');
  
  // Add or update fee settings
  console.log('🔧 Adding fee settings...');
  
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_enabled', 'true');
  console.log('  ✅ Added fee_enabled = true');
  
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_percentage', '0.5');
  console.log('  ✅ Added fee_percentage = 0.5');
  
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
  console.log('  ✅ Added fee_wallet_address');
  
  console.log('');
  
  // Verify settings were added
  const newSettings = db.prepare('SELECT key, value FROM settings WHERE key LIKE ?').all('fee%');
  console.log('✅ Verified fee settings:');
  newSettings.forEach(s => console.log('  -', s.key, '=', s.value));
  
  db.close();
  console.log('');
  console.log('✅ DATABASE UPDATED SUCCESSFULLY!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
"@

# Execute the Node.js script
$result = node -e $nodeScript

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to update database" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try the manual DevTools fix instead:" -ForegroundColor Yellow
    Write-Host "1. Open Anvil Solo"
    Write-Host "2. Press F12"
    Write-Host "3. Go to Console tab"
    Write-Host "4. Type: window.electron.fees.updateConfig({feeEnabled: true, feePercentage: 0.5, feeWalletAddress: '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'});"
    Write-Host "5. Press Enter"
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ DATABASE UPDATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start Anvil Solo"
Write-Host "  2. Check console (F12) for fee messages"
Write-Host "  3. Make a test trade"
Write-Host "  4. Check fee wallet on Solscan"
Write-Host ""
Write-Host "Fee Wallet to Monitor:" -ForegroundColor Yellow
Write-Host "  82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd"
Write-Host "  https://solscan.io/account/82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd"
Write-Host ""
pause

