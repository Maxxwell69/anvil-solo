@echo off
echo ========================================
echo Anvil Solo - Version Update Script
echo ========================================
echo.

set /p VERSION="Enter new version (e.g., 3.1.2): "

echo.
echo Updating to version %VERSION%...
echo.

REM Update package.json
echo [1/5] Updating package.json...
powershell -Command "(gc anvil3.0\anvil-solo\package.json) -replace '\"version\": \".*\"', '\"version\": \"%VERSION%\"' | Out-File -encoding UTF8 anvil3.0\anvil-solo\package.json"

REM Update HTML
echo [2/5] Updating UI version badge...
powershell -Command "(gc anvil3.0\anvil-solo\src\renderer\index.html) -replace '<span class=\"version-badge\" id=\"app-version\">v.*</span>', '<span class=\"version-badge\" id=\"app-version\">v%VERSION%</span>' | Out-File -encoding UTF8 anvil3.0\anvil-solo\src\renderer\index.html"

REM Update dashboard.js - version field
echo [3/5] Updating cloud services dashboard...
powershell -Command "(gc anvil3.0\cloud-services\public\js\dashboard.js) -replace 'version: ''[\d\.]+''', 'version: ''%VERSION%''' | Out-File -encoding UTF8 anvil3.0\cloud-services\public\js\dashboard.js"

REM Update dashboard.js - download URL
powershell -Command "(gc anvil3.0\cloud-services\public\js\dashboard.js) -replace 'download/v[\d\.]+/Anvil-Solo-Setup-[\d\.]+\.exe', 'download/v%VERSION%/Anvil-Solo-Setup-%VERSION%.exe' | Out-File -encoding UTF8 anvil3.0\cloud-services\public\js\dashboard.js"

echo [4/5] Building application...
cd anvil3.0\anvil-solo
call npm run build

echo [5/5] Creating installer...
call npx electron-builder --win --config.npmRebuild=false

cd ..\..

echo.
echo ========================================
echo ✅ Version Updated to %VERSION%!
echo ========================================
echo.
echo Installer created: anvil3.0\anvil-solo\release\Anvil Solo-Setup-%VERSION%.exe
echo.
echo ========================================
echo 📋 NEXT STEPS:
echo ========================================
echo.
echo 1. Test the installer locally
echo.
echo 2. Create git commit:
echo    git add .
echo    git commit -m "Release v%VERSION%"
echo.
echo 3. Create and push git tag:
echo    git tag -a v%VERSION% -m "Version %VERSION%"
echo    git push origin main
echo    git push origin v%VERSION%
echo.
echo 4. Create GitHub Release:
echo    - Go to: https://github.com/Maxxwell69/anvil-solo/releases/new
echo    - Tag: v%VERSION%
echo    - Upload: anvil3.0\anvil-solo\release\Anvil Solo-Setup-%VERSION%.exe
echo.
echo 5. Deploy cloud services:
echo    cd anvil3.0\cloud-services
echo    git add public/js/dashboard.js
echo    git commit -m "Update download link to v%VERSION%"
echo    git push
echo.
echo ========================================
pause

