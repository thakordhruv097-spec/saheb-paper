@echo off
echo ===================================================
echo   Saheb Paper Pvt. Ltd. - Web Asset Sync
echo ===================================================
echo.
echo Building web assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Syncing web assets with Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo [SUCCESS] Web assets synchronized successfully!
echo ===================================================
echo.
pause

