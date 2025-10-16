@echo off
echo ========================================
echo   Upload to GitHub Release
echo ========================================
echo.
echo Tag v3.0.0 has been created and pushed to GitHub!
echo.
echo Now you need to:
echo 1. Upload the installer file to the GitHub release
echo 2. Open your browser to the releases page
echo.
pause
echo.
echo Opening GitHub releases page...
start https://github.com/Maxxwell69/anvil-solo/releases/new?tag=v3.0.0
echo.
echo ========================================
echo   INSTRUCTIONS
echo ========================================
echo.
echo When the page opens:
echo.
echo 1. Title: Anvil Solo v3.0.0
echo.
echo 2. Description (copy this):
echo    ---
echo    Professional Solana Trading Bot
echo    
echo    Features:
echo    - DCA automated trading
echo    - Ratio trading for volume generation
echo    - Bundle trading
echo    - Jupiter DEX integration
echo    ---
echo.
echo 3. Upload file:
echo    Drag and drop this file:
echo    %CD%\anvil-solo\anvil-solo-portable.zip
echo.
echo    OR
echo.
echo    %CD%\cloud-services\public\downloads\anvil-solo-setup.zip
echo.
echo 4. Click "Publish release"
echo.
echo 5. After publishing, copy the download link:
echo    It will be:
echo    https://github.com/Maxxwell69/anvil-solo/releases/download/v3.0.0/anvil-solo-portable.zip
echo.
echo ========================================
pause

