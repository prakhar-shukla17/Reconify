@echo off
echo Stopping ITAM Scanner...

REM Find and kill pythonw processes running the ITAM scanner
echo Looking for ITAM Scanner processes...

REM Method 1: Kill by process name (pythonw.exe)
taskkill /F /IM pythonw.exe >nul 2>&1
if errorlevel 1 (
    echo No pythonw.exe processes found
) else (
    echo Stopped pythonw.exe processes
)

REM Method 2: Kill by script name (more specific)
for /f "tokens=2" %%i in ('tasklist /FI "WINDOWTITLE eq *itam_scanner*" /FO CSV ^| find "pythonw.exe"') do (
    echo Stopping process %%i
    taskkill /F /PID %%i >nul 2>&1
)

REM Method 3: Kill any remaining Python processes that might be running the scanner
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq python.exe" /FO CSV ^| find "python.exe"') do (
    echo Checking Python process %%i
    wmic process where "ProcessId=%%i" get CommandLine /format:list | find "itam_scanner" >nul
    if not errorlevel 1 (
        echo Stopping ITAM Scanner process %%i
        taskkill /F /PID %%i >nul 2>&1
    )
)

echo.
echo ITAM Scanner stopped.
echo.
pause
