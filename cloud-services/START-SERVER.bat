@echo off
echo ================================
echo Starting Anvil License Server...
echo ================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo ERROR: Dependencies not installed!
    echo Please run INSTALL.bat first
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please run INSTALL.bat first
    pause
    exit /b 1
)

REM Check if built
if not exist "dist\" (
    echo Building TypeScript...
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
)

echo Starting server...
echo.
echo ================================
echo Server will start on port 3000
echo ================================
echo.
echo Web Interface: http://localhost:3000
echo Admin Panel:   http://localhost:3000/admin
echo API:           http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo ================================
echo.

call npm start


