@echo off
echo ========================================
echo  Copy Anvil Solo to Download Server
echo ========================================
echo.

set ANVIL_SOLO_DIR=anvil-solo
set DOWNLOAD_DIR=cloud-services\public\downloads

echo Checking for built Anvil Solo...

if not exist "%ANVIL_SOLO_DIR%\release\" (
    echo ERROR: No release folder found!
    echo.
    echo Please build Anvil Solo first:
    echo   cd anvil-solo
    echo   npm run build
    echo   npm run package
    echo.
    pause
    exit /b 1
)

echo.
echo Found release folder!
echo.

REM Find the exe file
if exist "%ANVIL_SOLO_DIR%\release\Anvil-Solo-Setup-3.0.0.exe" (
    set FOUND_FILE=%ANVIL_SOLO_DIR%\release\Anvil-Solo-Setup-3.0.0.exe
) else (
    for %%f in ("%ANVIL_SOLO_DIR%\release\*.exe") do set FOUND_FILE=%%f
)

if defined FOUND_FILE (
    echo Found: %FOUND_FILE%
    echo Copying to: %DOWNLOAD_DIR%\anvil-solo-setup.exe
    copy "%FOUND_FILE%" "%DOWNLOAD_DIR%\anvil-solo-setup.exe"
    
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo SUCCESS! File copied!
        echo ========================================
        echo.
        echo File location:
        echo %DOWNLOAD_DIR%\anvil-solo-setup.exe
        echo.
        echo Next steps:
        echo 1. Test download locally: npm run dev
        echo 2. Or deploy to Railway: git push
        echo.
        echo Users can now download from:
        echo - Dashboard -^> Downloads tab
        echo - Direct: /api/downloads/windows-setup
        echo ========================================
        pause
        exit /b 0
    ) else (
        echo ERROR: Failed to copy file
        pause
        exit /b 1
    )
)

echo.
echo ERROR: No .exe file found in release folder
echo Please run: npm run package
echo.
pause
exit /b 1

