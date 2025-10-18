@echo off
echo ========================================
echo   ANVIL SOLO - Console Debug Mode
echo ========================================
echo.
echo This will run Anvil Solo with console output visible.
echo You can see all debug logs including license activation.
echo.
echo Press any key to start...
pause > nul

cd /d "%~dp0release\win-unpacked"

REM Set environment to show console
set ELECTRON_ENABLE_LOGGING=1

REM Run the app
start "" "Anvil Solo.exe" --enable-logging

echo.
echo App started! Check the console window that opens.
echo Press any key to exit this window...
pause > nul

