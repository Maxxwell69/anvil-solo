@echo off
echo ========================================
echo   Copy Installer to Downloads Folder
echo ========================================
echo.

set DOWNLOADS_DIR=cloud-services\public\downloads

REM Check if installer exists
if not exist "anvil-solo\release\*.exe" (
    echo ERROR: No installer found!
    echo.
    echo Please build the installer first:
    echo   BUILD-INSTALLER-SIMPLE.bat
    echo.
    pause
    exit /b 1
)

REM Create downloads directory if needed
if not exist "%DOWNLOADS_DIR%" (
    echo Creating downloads directory...
    mkdir "%DOWNLOADS_DIR%"
)

REM Copy installer
echo Copying installer...
copy "anvil-solo\release\*.exe" "%DOWNLOADS_DIR%\anvil-solo-setup.exe"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy installer
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ SUCCESS!
echo ========================================
echo.
echo Installer copied to:
echo %DOWNLOADS_DIR%\anvil-solo-setup.exe
echo.

REM Show file size
for %%A in ("%DOWNLOADS_DIR%\anvil-solo-setup.exe") do (
    echo File size: %%~zA bytes
    set /a sizeMB=%%~zA / 1048576
)
echo Size: ~%sizeMB% MB
echo.

echo Next steps:
echo.
echo TEST LOCALLY:
echo   cd cloud-services
echo   npm run dev
echo   Visit: http://localhost:3000/api/downloads/windows-setup
echo.
echo OR DEPLOY:
echo   cd cloud-services
echo   git add public/downloads/
echo   git commit -m "Add installer"
echo   git push
echo.
pause

