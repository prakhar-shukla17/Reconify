@echo off
echo ITAM Scanner Installer
echo =====================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo Warning: Not running as administrator. Some features may not work properly.
    echo Consider running as administrator for full functionality.
    echo.
)

REM Create installation directory
set "INSTALL_DIR=%PROGRAMFILES%ITAM Scanner"
echo Installation directory: %INSTALL_DIR%

REM Create directory with proper error handling
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%" 2>nul
    if errorlevel 1 (
        echo Error: Failed to create installation directory
        echo Please run as administrator or choose a different location
        pause
        exit /b 1
    )
    echo Directory created successfully
) else (
    echo Directory already exists
)

REM Copy executable and configuration
echo Installing ITAM Scanner...

REM Copy executable
copy "ITAM_Scanner.exe" "%INSTALL_DIR%ITAM_Scanner.exe" >nul 2>&1
if errorlevel 1 (
    echo Error: Failed to copy ITAM_Scanner.exe
    echo Make sure the file exists and you have write permissions
    pause
    exit /b 1
)
echo ITAM_Scanner.exe copied successfully

REM Copy configuration
copy "config.env" "%INSTALL_DIR%config.env" >nul 2>&1
if errorlevel 1 (
    echo Error: Failed to copy config.env
    pause
    exit /b 1
)
echo config.env copied successfully

REM Copy background executable if it exists
if exist "ITAM_Scanner_Background.exe" (
    copy "ITAM_Scanner_Background.exe" "%INSTALL_DIR%ITAM_Scanner_Background.exe" >nul 2>&1
    if errorlevel 1 (
        echo Error: Failed to copy ITAM_Scanner_Background.exe
        pause
        exit /b 1
    )
    echo ITAM_Scanner_Background.exe copied successfully
) else (
    echo ITAM_Scanner_Background.exe not found, skipping
)

REM Create start menu shortcut
set "START_MENU=%APPDATA%MicrosoftWindowsStart MenuPrograms"
if not exist "%START_MENU%ITAM Scanner" (
    mkdir "%START_MENU%ITAM Scanner"
)

REM Create desktop shortcut
echo Creating shortcuts...
echo [InternetShortcut] > "%USERPROFILE%DesktopITAM Scanner.url"
echo URL=file:///%INSTALL_DIR%/ITAM_Scanner.exe >> "%USERPROFILE%DesktopITAM Scanner.url"
echo IconFile=%INSTALL_DIR%/ITAM_Scanner.exe >> "%USERPROFILE%DesktopITAM Scanner.url"
echo IconIndex=0 >> "%USERPROFILE%DesktopITAM Scanner.url"

echo.
echo Verifying installation...

REM Verify files exist
if exist "%INSTALL_DIR%ITAM_Scanner.exe" (
    echo ✓ ITAM_Scanner.exe found
) else (
    echo ✗ ITAM_Scanner.exe not found
    echo Installation may have failed
    pause
    exit /b 1
)

if exist "%INSTALL_DIR%config.env" (
    echo ✓ config.env found
) else (
    echo ✗ config.env not found
    echo Installation may have failed
    pause
    exit /b 1
)

echo.
echo ✅ Installation completed successfully!
echo.
echo ITAM Scanner has been installed to: %INSTALL_DIR%
echo Desktop shortcut created.
echo.
echo To start the scanner:
echo 1. Double-click the desktop shortcut (console mode)
echo 2. Run: "%INSTALL_DIR%ITAM_Scanner.exe" (console mode)
echo 3. Run: "%INSTALL_DIR%ITAM_Scanner_Background.exe" (background mode)
echo.
echo Background mode runs without console window and continues after closing.
echo.
echo The scanner is a standalone executable that includes all dependencies.
echo No Python installation required - it will run automatically in the background.
echo.
echo Configuration:
echo - Tenant ID: ba7816bf8f01cfea
echo - API URL: http://localhost:3000/api
echo.
echo The scanner will automatically start scanning your system.
echo.
pause
