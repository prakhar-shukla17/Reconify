@echo off
echo ITAM Scanner Starting...
echo Tenant ID: fb8e20fc2e4c3f24
echo API URL: http://localhost:3000/api

REM Set environment variables
set TENANT_ID=fb8e20fc2e4c3f24
set API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI3YzQwMWMwMzI5MTU4Y2M0NWIxNzUiLCJ0ZW5hbnRfaWQiOiJmYjhlMjBmYzJlNGMzZjI0IiwiZmlyc3ROYW1lIjoiU2hpdmFtIiwibGFzdE5hbWUiOiJNb2hpdCIsImVtYWlsIjoic21zaW5naDAwMDBAZ21haWwuY29tIiwiZGVwYXJ0bWVudCI6IiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njg3Mzk1NywiZXhwIjoxNzU3NDc4NzU3fQ.kEhICpUaLkeDY0jY-OP5B1tEfuzKI0Wpif5y_9bLoq8
set API_BASE_URL=http://localhost:3000/api

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the scanner
echo Starting ITAM Scanner...
python itam_scanner.py

pause
