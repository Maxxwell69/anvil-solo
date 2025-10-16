@echo off
echo ========================================
echo   Build Anvil Solo with Verification
echo ========================================
echo.

REM Step 1: Clean previous builds
echo [1/5] Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release
echo       ✓ Cleaned

REM Step 2: Install dependencies
echo.
echo [2/5] Checking dependencies...
if not exist "node_modules" (
    echo       Installing dependencies...
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
echo [3/5] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo       ✗ Build failed
    pause
    exit /b 1
)
echo       ✓ Application built

REM Step 4: Create installer
echo.
echo [4/5] Creating Windows installer...
call npm run package
if %errorlevel% neq 0 (
    echo       ✗ Installer creation failed
    pause
    exit /b 1
)
echo       ✓ Installer created

REM Step 5: Generate checksums
echo.
echo [5/5] Generating verification checksums...
cd release
for %%f in (*.exe) do (
    echo Computing SHA-256 for %%f...
    certutil -hashfile "%%f" SHA256 > "%%f.sha256.txt"
    if %errorlevel% neq 0 (
        echo       ✗ Failed to generate checksum
        cd ..
        pause
        exit /b 1
    )
    echo       ✓ Checksum saved to %%f.sha256.txt
)
cd ..

echo.
echo ========================================
echo   ✓ SUCCESS! Build Complete!
echo ========================================
echo.
echo 📦 Installer Location:
dir /b release\*.exe
echo.
echo 🔒 Checksum Files:
dir /b release\*.sha256.txt
echo.
echo 📊 File Sizes:
for %%f in (release\*.exe) do (
    echo    %%~zf bytes - %%~nxf
)
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. TEST INSTALLER LOCALLY
echo    - Run the installer on this machine
echo    - Verify app launches and works
echo.
echo 2. VERIFY CHECKSUM
echo    - Open release\*.sha256.txt
echo    - Share this hash with users for verification
echo.
echo 3. COPY TO DOWNLOAD SERVER
echo    - Run: ..\COPY-TO-DOWNLOADS.bat
echo    - Or manually copy from release\ folder
echo.
echo 4. DISTRIBUTE
echo    - Upload to your server
echo    - Share download link with users
echo    - Include the SHA-256 hash for verification
echo.
echo ========================================
pause

