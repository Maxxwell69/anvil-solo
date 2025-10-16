@echo off
echo ========================================
echo   Build Installer and Copy to Downloads
echo ========================================
echo.

set ANVIL_SOLO_DIR=anvil-solo
set DOWNLOADS_DIR=cloud-services\public\downloads

echo [1/3] Building Anvil Solo installer...
cd %ANVIL_SOLO_DIR%

REM Always install/update dependencies to ensure TypeScript is available
echo Installing/updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    cd ..
    pause
    exit /b 1
)

REM Build the app using npx to ensure tsc is found
echo Building TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo ERROR: TypeScript compilation failed
    cd ..
    pause
    exit /b 1
)

REM Copy renderer files
echo Copying renderer files...
if exist "src\renderer" (
    if not exist "dist\renderer" mkdir "dist\renderer"
    xcopy /E /I /Y "src\renderer" "dist\renderer"
)
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    cd ..
    pause
    exit /b 1
)

REM Package as installer
echo Creating installer...
call npm run package
if %errorlevel% neq 0 (
    echo ERROR: Package failed
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ Installer built successfully!
echo.

echo [2/3] Copying installer to downloads folder...

REM Check if downloads directory exists
if not exist "%DOWNLOADS_DIR%" (
    echo Creating downloads directory...
    mkdir "%DOWNLOADS_DIR%"
)

REM Find and copy the installer
if exist "%ANVIL_SOLO_DIR%\release\*.exe" (
    echo Copying installer...
    copy "%ANVIL_SOLO_DIR%\release\*.exe" "%DOWNLOADS_DIR%\anvil-solo-setup.exe"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to copy installer
        pause
        exit /b 1
    )
    echo ✅ Installer copied!
) else (
    echo ERROR: No installer found in %ANVIL_SOLO_DIR%\release\
    echo Make sure the build completed successfully
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying installation...

if exist "%DOWNLOADS_DIR%\anvil-solo-setup.exe" (
    echo ✅ File exists: %DOWNLOADS_DIR%\anvil-solo-setup.exe
    
    REM Get file size
    for %%A in ("%DOWNLOADS_DIR%\anvil-solo-setup.exe") do (
        echo File size: %%~zA bytes (%%~zA / 1048576 MB)
    )
) else (
    echo ERROR: File not found in downloads folder
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ SUCCESS!
echo ========================================
echo.
echo Installer is ready at:
echo %DOWNLOADS_DIR%\anvil-solo-setup.exe
echo.
echo Next steps:
echo 1. Test locally: npm run dev (in cloud-services folder)
echo 2. Visit: http://localhost:3000/api/downloads/windows-setup
echo 3. Or deploy: git add . && git commit -m "Add installer" && git push
echo.
echo Users can download from:
echo https://anvil-solo-production.up.railway.app/api/downloads/windows-setup
echo.
pause

