@echo off
REM Quick Deploy Script for Railway
REM Run this from the cloud-services folder

echo.
echo ========================================
echo   ANVIL CLOUD SERVICES
echo   Railway Deployment Script
echo ========================================
echo.

echo This script will guide you through deploying to Railway.
echo.
echo Prerequisites:
echo   1. Railway CLI installed (npm install -g @railway/cli)
echo   2. Railway account created (railway.app)
echo   3. Logged in (railway login)
echo.

pause

echo.
echo [1/6] Checking Railway CLI...
where railway >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found!
    echo.
    echo Install it with:
    echo   npm install -g @railway/cli
    echo.
    pause
    exit /b 1
)
echo ✅ Railway CLI found

echo.
echo [2/6] Initializing Railway project...
echo.
echo When prompted:
echo   - Choose: Create new project
echo   - Name: anvil-cloud-services
echo.
railway init

echo.
echo [3/6] Adding PostgreSQL database...
echo.
echo When prompted:
echo   - Select: PostgreSQL
echo.
railway add

echo.
echo [4/6] Setting environment variables...
echo.
echo You'll need to set these manually or use the commands below:
echo.
echo railway variables set ADMIN_KEY=your_secure_key_here
echo railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
echo railway variables set FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
echo railway variables set ALLOWED_ORIGINS=*
echo railway variables set NODE_ENV=production
echo.

pause

echo.
echo [5/6] Building and deploying...
echo This may take 2-3 minutes...
echo.
railway up

echo.
echo [6/6] Getting deployment info...
railway status
railway open

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your API is now live!
echo.
echo Next steps:
echo   1. Test health endpoint: /health
echo   2. Generate a test license
echo   3. Update desktop app with your Railway URL
echo   4. Start using cloud features!
echo.
echo View logs: railway logs
echo View variables: railway variables
echo Open dashboard: railway open
echo.

pause


