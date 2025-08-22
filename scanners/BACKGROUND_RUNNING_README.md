# ITAM Scanner - Background Running

This document explains how to run the ITAM Scanner in the background so it continues running even when you close the command prompt.

## Method 1: Using PowerShell Service Script (Recommended)

The PowerShell script provides the best control and monitoring capabilities.

### Start the Scanner
```powershell
.\run_itam_scanner_service.ps1 -Start
```

### Check Status
```powershell
.\run_itam_scanner_service.ps1 -Status
```

### Stop the Scanner
```powershell
.\run_itam_scanner_service.ps1 -Stop
```

### Show Help
```powershell
.\run_itam_scanner_service.ps1
```

## Method 2: Using Batch Script

### Start the Scanner
```cmd
run_itam_scanner_background.bat
```

### Stop the Scanner
```cmd
stop_itam_scanner.bat
```

## Method 3: Manual Background Process

### Start in Background
```cmd
start /B pythonw itam_scanner.py
```

### Check if Running
```cmd
tasklist /FI "IMAGENAME eq pythonw.exe"
```

### Stop Manually
```cmd
taskkill /F /IM pythonw.exe
```

## Features

### ✅ Background Operation
- Scanner continues running when command prompt is closed
- Uses `pythonw.exe` (Python without console window)
- Process runs independently of the terminal

### ✅ Logging
- All logs are saved to `logs/itam_scanner.log`
- Service management logs in `logs/service.log`
- Console output still available when running interactively

### ✅ Process Management
- PID tracking for easy process management
- Status checking to see if scanner is running
- Graceful shutdown with signal handling

### ✅ Automatic Dependencies
- Automatically installs required Python packages
- Checks Python installation
- Creates necessary directories

## Scan Intervals

- **Hardware & Software Scans**: Every 60 minutes (1 hour)
- **Telemetry Scans**: Every 10 minutes
- **Initial Scan**: Runs immediately when started

## Monitoring

### Check Scanner Status
```powershell
.\run_itam_scanner_service.ps1 -Status
```

### View Logs
```cmd
type logs\itam_scanner.log
```

### View Recent Logs
```cmd
powershell "Get-Content logs\itam_scanner.log -Tail 20"
```

## Troubleshooting

### Scanner Won't Start
1. Check if Python is installed: `python --version`
2. Check if dependencies are installed: `pip list`
3. Check logs: `type logs\itam_scanner.log`

### Scanner Stops Unexpectedly
1. Check system resources (CPU, memory)
2. Check network connectivity to API server
3. Review logs for error messages

### Can't Stop Scanner
1. Use Task Manager to find and kill `pythonw.exe` processes
2. Use: `taskkill /F /IM pythonw.exe`
3. Restart the service script

## Configuration

The scanner configuration is in `itam_scanner.py`:
- `API_BASE_URL`: API server address (default: http://localhost:3000/api)
- `HARDWARE_SOFTWARE_INTERVAL`: Hardware/software scan interval in minutes
- `TELEMETRY_INTERVAL`: Telemetry scan interval in minutes

## Security Notes

- The scanner runs with the same permissions as the user who started it
- Logs may contain sensitive system information
- Ensure the API server is properly secured
- Consider running as a Windows service for production use
