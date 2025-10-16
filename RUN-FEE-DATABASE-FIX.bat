@echo off
echo Running Fee Database Fix...
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0FIX-FEE-DATABASE-NOW.ps1"

