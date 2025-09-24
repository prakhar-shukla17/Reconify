@echo off
echo Installing ITAM Scanner Dependencies...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing dependencies...
echo.

REM Install dependencies from requirements.txt
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install some dependencies
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo SUCCESS: All dependencies installed successfully!
echo You can now run the ITAM Scanner
echo.
pause

