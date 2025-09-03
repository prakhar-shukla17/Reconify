@echo off
echo Installing ITAM Scanner as Windows Service...

REM Set environment variables
set TENANT_ID=fb8e20fc2e4c3f24
set API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI3YzQwMWMwMzI5MTU4Y2M0NWIxNzUiLCJ0ZW5hbnRfaWQiOiJmYjhlMjBmYzJlNGMzZjI0IiwiZmlyc3ROYW1lIjoiU2hpdmFtIiwibGFzdE5hbWUiOiJNb2hpdCIsImVtYWlsIjoic21zaW5naDAwMDBAZ21haWwuY29tIiwiZGVwYXJ0bWVudCI6IiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njg3Mzk1NywiZXhwIjoxNzU3NDc4NzU3fQ.kEhICpUaLkeDY0jY-OP5B1tEfuzKI0Wpif5y_9bLoq8
set API_BASE_URL=http://localhost:3000/api

REM Install as Windows service (requires admin privileges)
sc create "ITAM Scanner" binPath= "python "%~dp0itam_scanner.py"" start= auto
sc description "ITAM Scanner" "IT Asset Management Scanner for fb8e20fc2e4c3f24"
sc start "ITAM Scanner"

echo ITAM Scanner service installed and started
pause
