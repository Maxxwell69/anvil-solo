@echo off
echo ========================================
echo   Build Anvil Solo Installer (Simple)
echo ========================================
echo.

cd anvil-solo

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [2/4] Building TypeScript with npx...
call npx tsc
if %errorlevel% neq 0 (
    echo ERROR: TypeScript build failed
    cd ..
    pause
    exit /b 1
)
echo ✅ TypeScript compiled

echo.
echo [3/4] Copying renderer files...
if exist "src\renderer" (
    if not exist "dist\renderer" mkdir "dist\renderer"
    xcopy /E /I /Y "src\renderer" "dist\renderer" >nul 2>&1
    echo ✅ Renderer files copied
)

echo.
echo [4/4] Creating installer with electron-builder...
call npx electron-builder
if %errorlevel% neq 0 (
    echo ERROR: electron-builder failed
    cd ..
    pause
    exit /b 1
)
echo ✅ Installer created!

cd ..

echo.
echo ========================================
echo   ✅ BUILD COMPLETE!
echo ========================================
echo.
echo Installer location:
dir /b anvil-solo\release\*.exe 2>nul
echo.
echo Full path:
cd anvil-solo\release
dir *.exe
cd ..\..

echo.
echo Next step: Copy to downloads folder
echo Run: COPY-INSTALLER-TO-DOWNLOADS.bat
echo.
pause

