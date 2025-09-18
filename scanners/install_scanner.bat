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
set "INSTALL_DIR=%PROGRAMFILES%\ITAM Scanner"
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory: %INSTALL_DIR%
    mkdir "%INSTALL_DIR%"
)

REM Copy executable
echo Installing ITAM Scanner...
copy "ITAM_Scanner.exe" "%INSTALL_DIR%\ITAM_Scanner.exe"

REM Create start menu shortcut
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if not exist "%START_MENU%\ITAM Scanner" (
    mkdir "%START_MENU%\ITAM Scanner"
)

REM Create desktop shortcut
echo Creating shortcuts...
echo [InternetShortcut] > "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo URL=file:///%INSTALL_DIR%\ITAM_Scanner.exe >> "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo IconFile=%INSTALL_DIR%\ITAM_Scanner.exe >> "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo IconIndex=0 >> "%USERPROFILE%\Desktop\ITAM Scanner.url"

echo.
echo Installation completed!
echo.
echo ITAM Scanner has been installed to: %INSTALL_DIR%
echo Desktop shortcut created.
echo.
echo To start the scanner, double-click the desktop shortcut or run:
echo "%INSTALL_DIR%\ITAM_Scanner.exe"
echo.
echo The scanner will run in the background and automatically scan your system.
echo.
pause
