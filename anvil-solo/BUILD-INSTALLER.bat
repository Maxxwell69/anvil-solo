@echo off
echo ========================================
echo   Building Anvil Solo Professional Installer
echo ========================================
echo.
echo This will create a Windows installer that:
echo   - Asks for administrator permissions
echo   - Installs to Program Files
echo   - Creates desktop shortcut
echo   - Adds to Start Menu
echo   - Includes uninstaller
echo   - Shows license agreement
echo.
echo Starting build process...
echo.

REM Step 1: Clean previous builds
echo [1/4] Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release
echo       ✓ Cleaned

REM Step 2: Install dependencies (skip if already exists)
echo.
echo [2/4] Installing dependencies...
if not exist "node_modules" (
    call npm install --ignore-scripts
    if %errorlevel% neq 0 (
        echo       ✗ Failed to install dependencies
        pause
        exit /b 1
    )
    echo       ✓ Dependencies installed
) else (
    echo       ✓ Dependencies already installed
)

REM Step 3: Build TypeScript
echo.
echo [3/4] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo       ✗ Build failed
    pause
    exit /b 1
)
echo       ✓ Application built

REM Step 4: Create installer
echo.
echo [4/4] Creating Windows installer...
call npm run package
if %errorlevel% neq 0 (
    echo       ✗ Installer creation failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ SUCCESS! Installer Created!
echo ========================================
echo.
echo Location: release\Anvil-Solo-Setup-3.0.0.exe
echo.
dir /b release\*.exe
echo.
echo Next Steps:
echo   1. Test the installer locally
echo   2. Copy to download server:
echo      - Run: ..\COPY-TO-DOWNLOADS.bat
echo   3. Or test manually:
echo      - Double-click the installer
echo      - Follow installation wizard
echo.
echo ========================================
pause

