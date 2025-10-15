@echo off
echo ========================================
echo    Railway Deployment - Quick Start
echo ========================================
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Railway CLI not found!
    echo.
    echo Installing Railway CLI...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Railway CLI
        echo Please install manually from: https://railway.app/cli
        pause
        exit /b 1
    )
)

echo [Step 1] Railway CLI Ready!
echo.

echo [Step 2] Login to Railway
echo Opening browser for login...
railway login
if %errorlevel% neq 0 (
    echo ERROR: Login failed
    pause
    exit /b 1
)

echo.
echo [Step 3] Initialize Project
echo Creating new Railway project...
railway init
if %errorlevel% neq 0 (
    echo ERROR: Project initialization failed
    pause
    exit /b 1
)

echo.
echo [Step 4] Add PostgreSQL Database
echo Adding database...
railway add
echo.
echo IMPORTANT: Select "Database" then "PostgreSQL" from the menu above
pause

echo.
echo [Step 5] Setting Environment Variables
echo Generating secure keys...

for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ADMIN_KEY=%%i

echo.
echo Generated Keys:
echo JWT_SECRET: %JWT_SECRET%
echo ADMIN_KEY: %ADMIN_KEY%
echo.
echo Setting variables on Railway...

railway variables set JWT_SECRET=%JWT_SECRET%
railway variables set ADMIN_KEY=%ADMIN_KEY%
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=*
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd

echo.
echo [Step 6] Deploying to Railway
echo Uploading and deploying your code...
railway up

if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    echo Check logs with: railway logs
    pause
    exit /b 1
)

echo.
echo [Step 7] Generating Public Domain
railway domain

echo.
echo ========================================
echo    DEPLOYMENT COMPLETE! 
echo ========================================
echo.
echo Your license server is now live on Railway!
echo.
echo To view your deployment:
echo   railway open
echo.
echo To view logs:
echo   railway logs
echo.
echo To get your URL:
echo   railway status
echo.
echo Save your credentials:
echo   JWT_SECRET: %JWT_SECRET%
echo   ADMIN_KEY: %ADMIN_KEY%
echo.
echo Next steps:
echo   1. Get your URL with: railway status
echo   2. Visit your URL in browser
echo   3. Register first user
echo   4. Make them admin in database
echo.
echo ========================================
pause

