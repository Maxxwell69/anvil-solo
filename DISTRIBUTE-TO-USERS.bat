@echo off
echo ========================================
echo   Distribute Anvil Solo to Users
echo ========================================
echo.
echo This will copy everything users need to
echo the download server directory.
echo.

set ANVIL_SOLO_DIR=anvil-solo
set DOWNLOAD_DIR=cloud-services\public\downloads
set DOCS_DIR=cloud-services\public\docs

REM Check if installer exists
if not exist "%ANVIL_SOLO_DIR%\release\Anvil-Solo-Setup-3.0.0.exe" (
    echo ERROR: Installer not found!
    echo.
    echo Please build the installer first:
    echo   cd anvil-solo
    echo   BUILD-AND-VERIFY.bat
    echo.
    pause
    exit /b 1
)

echo [1/4] Creating directories...
if not exist "%DOWNLOAD_DIR%" mkdir "%DOWNLOAD_DIR%"
if not exist "%DOCS_DIR%" mkdir "%DOCS_DIR%"
echo       ✓ Directories ready

echo.
echo [2/4] Copying installer...
copy "%ANVIL_SOLO_DIR%\release\Anvil-Solo-Setup-3.0.0.exe" "%DOWNLOAD_DIR%\anvil-solo-setup.exe"
if %errorlevel% neq 0 (
    echo       ✗ Failed to copy installer
    pause
    exit /b 1
)
echo       ✓ Installer copied

echo.
echo [3/4] Copying checksums...
if exist "%ANVIL_SOLO_DIR%\release\*.sha256.txt" (
    copy "%ANVIL_SOLO_DIR%\release\*.sha256.txt" "%DOWNLOAD_DIR%\anvil-solo-setup.exe.sha256.txt"
    echo       ✓ Checksum copied
) else (
    echo       ⚠ No checksum found (build with BUILD-AND-VERIFY.bat)
)

echo.
echo [4/4] Copying user documentation...
copy "%ANVIL_SOLO_DIR%\DOWNLOAD_AND_INSTALL.md" "%DOCS_DIR%\installation-guide.md"
copy "%ANVIL_SOLO_DIR%\USER_QUICK_START.md" "%DOCS_DIR%\quick-start-guide.md"
copy "%ANVIL_SOLO_DIR%\README_FOR_USERS.md" "%DOCS_DIR%\user-manual.md"
copy "%ANVIL_SOLO_DIR%\SIMPLE_INSTALL_INSTRUCTIONS.txt" "%DOCS_DIR%\simple-instructions.txt"
copy "%ANVIL_SOLO_DIR%\DOWNLOAD_PAGE.html" "%DOCS_DIR%\download.html"
echo       ✓ Documentation copied

echo.
echo ========================================
echo   ✓ SUCCESS! Ready for Distribution
echo ========================================
echo.
echo Files copied to:
echo   %DOWNLOAD_DIR%\
echo   %DOCS_DIR%\
echo.
echo 📦 Installer:
dir /b "%DOWNLOAD_DIR%\*.exe"
echo.
echo 📄 Documentation:
dir /b "%DOCS_DIR%"
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo OPTION 1: Test Locally
echo   cd cloud-services
echo   npm run dev
echo   Visit: http://localhost:3000/docs/download.html
echo.
echo OPTION 2: Deploy to Railway
echo   cd cloud-services
echo   git add public/
echo   git commit -m "Add Anvil Solo v3.0.0"
echo   git push
echo.
echo Users will download from:
echo   - Dashboard: /downloads
echo   - Direct: /api/downloads/windows-setup
echo   - Docs: /docs/download.html
echo.
echo ========================================
pause

