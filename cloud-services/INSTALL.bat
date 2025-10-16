@echo off
echo ================================
echo Anvil License Server - Installer
echo ================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Generating secure keys...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ADMIN_KEY=%%i

echo.
echo [3/5] Creating .env file...
(
echo DATABASE_URL=postgresql://user:password@localhost:5432/anvil_licenses
echo JWT_SECRET=%JWT_SECRET%
echo ADMIN_KEY=%ADMIN_KEY%
echo PORT=3000
echo NODE_ENV=development
echo ALLOWED_ORIGINS=*
echo SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
echo FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
) > .env

echo.
echo [4/5] Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build
    pause
    exit /b 1
)

echo.
echo [5/5] Installation complete!
echo.
echo ================================
echo IMPORTANT: Update .env file
echo ================================
echo.
echo 1. Open .env file
echo 2. Update DATABASE_URL with your PostgreSQL connection string
echo 3. Update FEE_WALLET_ADDRESS with your Solana wallet (optional)
echo.
echo Your secure keys have been generated:
echo JWT_SECRET: %JWT_SECRET%
echo ADMIN_KEY: %ADMIN_KEY%
echo.
echo ================================
echo To start the server:
echo ================================
echo npm start
echo.
echo Then open: http://localhost:3000
echo.
pause


