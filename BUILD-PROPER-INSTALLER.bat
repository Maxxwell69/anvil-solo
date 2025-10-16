@echo off
echo ========================================
echo   Build Professional Windows Installer
echo ========================================
echo.
echo This will create a proper .exe installer that:
echo   - Installs to Program Files
echo   - Creates desktop shortcut
echo   - Creates Start Menu entry
echo   - Includes uninstaller
echo.
echo NOTE: This script must be run as ADMINISTRATOR
echo       to avoid symlink permission issues
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
echo Script location: %SCRIPT_DIR%
echo.

REM Change to script directory first
cd /d "%SCRIPT_DIR%"
echo Current directory: %CD%
echo.

pause

cd anvil-solo
if %errorlevel% neq 0 (
    echo ERROR: Cannot find anvil-solo folder!
    echo Make sure you're running this from the anvil3.0 directory
    pause
    exit /b 1
)

echo [1/5] Cleaning old builds...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release
echo ✅ Cleaned

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [3/5] Compiling TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo ERROR: TypeScript compilation failed
    pause
    exit /b 1
)
echo ✅ TypeScript compiled

echo.
echo [4/5] Copying renderer files...
xcopy /E /I /Y "src\renderer" "dist\renderer" >nul
echo ✅ Renderer copied

echo.
echo [5/5] Creating NSIS installer...
echo This may take 2-3 minutes...
call npx electron-builder --win nsis --config.npmRebuild=false
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   Build Failed - Trying Alternative
    echo ========================================
    echo.
    echo The NSIS installer failed. Creating portable version instead...
    echo.
    
    REM Create portable version as backup
    if exist "release\win-unpacked" (
        echo Creating portable ZIP as alternative...
        powershell -Command "Compress-Archive -Path 'release\win-unpacked\*' -DestinationPath 'release\AnvilSolo-Portable-v3.1.1.zip' -Force"
        echo.
        echo ✅ Portable version created instead!
        echo Location: release\AnvilSolo-Portable-v3.1.1.zip
        echo.
        echo For a proper installer, you need Windows Build Tools.
        echo See BUILD-REQUIREMENTS.md for details.
    )
    
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   ✅ SUCCESS! Installer Created!
echo ========================================
echo.
dir /b anvil-solo\release\*.exe
echo.
echo Next steps:
echo 1. Test the installer locally
echo 2. Upload to GitHub release
echo 3. Users download and run installer
echo 4. Installer does everything automatically!
echo.
pause

