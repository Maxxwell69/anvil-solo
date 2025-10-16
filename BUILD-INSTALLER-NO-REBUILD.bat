@echo off
echo ========================================
echo   Build Installer (Skip Native Rebuild)
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
echo [4/4] Creating installer (skipping native rebuild)...
echo This may take 2-3 minutes...
call npx electron-builder --config.npmRebuild=false
if %errorlevel% neq 0 (
    echo.
    echo ERROR: electron-builder failed
    echo.
    echo This might be because:
    echo 1. Native modules need to be rebuilt
    echo 2. Or the app has other build issues
    echo.
    echo Try installing Windows Build Tools:
    echo   npm install --global windows-build-tools
    echo.
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
if exist "anvil-solo\release\*.exe" (
    dir /b anvil-solo\release\*.exe
    echo.
    echo Ready to copy to downloads folder!
    echo Run: COPY-INSTALLER-TO-DOWNLOADS.bat
) else (
    echo ERROR: No .exe file found in release folder
    echo Check the build output above for errors
)
echo.
pause

