@echo off
REM Helper script to run PowerShell fix as Administrator

echo.
echo This will launch PowerShell as Administrator to fix Jupiter DNS
echo.
echo Please click "Yes" when prompted by Windows
echo.

PowerShell -Command "Start-Process PowerShell -ArgumentList '-ExecutionPolicy Bypass -File ""%~dp0Fix-Jupiter-Admin.ps1""' -Verb RunAs"

echo.
echo PowerShell window opened as Administrator
echo Follow the instructions in that window
echo.
pause




