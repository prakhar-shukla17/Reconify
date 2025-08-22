@echo off
echo Starting ITAM Scanner in background...
echo The scanner will continue running even if you close this window.
echo To stop the scanner, use the stop script or Task Manager.
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Installing/checking dependencies...
pip install -r requirements.txt >nul 2>&1

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Run the scanner in background with nohup equivalent for Windows
echo Starting ITAM Scanner...
start /B pythonw itam_scanner.py

REM Wait a moment to ensure the process starts
timeout /t 3 /nobreak >nul

REM Check if the process is running
tasklist /FI "IMAGENAME eq pythonw.exe" /FI "WINDOWTITLE eq *itam_scanner*" | find "pythonw.exe" >nul
if errorlevel 1 (
    echo ITAM Scanner started successfully in background
    echo Process ID: 
    tasklist /FI "IMAGENAME eq pythonw.exe" | find "pythonw.exe"
) else (
    echo ITAM Scanner is running in background
)

echo.
echo The scanner is now running in the background.
echo You can close this window - the scanner will continue running.
echo.
echo To check if it's running: tasklist /FI "IMAGENAME eq pythonw.exe"
echo To stop it: Use the stop_itam_scanner.bat script
echo.
pause
