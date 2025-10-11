# Create Desktop Shortcut for Anvil Solo
# Run this script to add a shortcut to your desktop

Write-Host ""
Write-Host "========================================"
Write-Host "  Creating Anvil Solo Desktop Shortcut"
Write-Host "========================================"
Write-Host ""

# Get desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Anvil Solo.lnk"

# Get the run.bat path
$anvilSoloPath = Join-Path $PSScriptRoot "anvil-solo\run.bat"

Write-Host "Desktop path: $desktopPath"
Write-Host "Shortcut will be created at: $shortcutPath"
Write-Host "Target: $anvilSoloPath"
Write-Host ""

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $anvilSoloPath
$shortcut.WorkingDirectory = Join-Path $PSScriptRoot "anvil-solo"
$shortcut.Description = "Anvil Solo - Solana Desktop Trading Bot"
$shortcut.Save()

Write-Host "SUCCESS! Shortcut created!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $shortcutPath"
Write-Host ""
Write-Host "You can now:"
Write-Host "  1. Go to your Desktop"
Write-Host "  2. Double-click 'Anvil Solo' shortcut"
Write-Host "  3. App will start automatically!"
Write-Host ""
Write-Host "========================================"
Write-Host "  Check Your Desktop!"
Write-Host "========================================"
Write-Host ""

# Open desktop folder
Start-Process explorer $desktopPath

Write-Host "Desktop folder opened. Look for 'Anvil Solo.lnk'!"
Write-Host ""
pause
