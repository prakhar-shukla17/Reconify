# ITAM Scanner Background Service Documentation

## Overview

The `itam_scanner_background.py` is a specialized version of the ITAM Scanner designed to run as a background service without a visible console window. This makes it ideal for production deployments where continuous monitoring is required without user interaction.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Development](#development)

## Features

### Core Capabilities
- **Silent Operation**: Runs without console window using `--noconsole` PyInstaller flag
- **Continuous Monitoring**: Automatically scans hardware and software at scheduled intervals
- **Background Execution**: Continues running even after closing the console window
- **Signal Handling**: Graceful shutdown on system signals (SIGINT, SIGTERM)
- **Comprehensive Logging**: Detailed logs for monitoring and debugging
- **Configuration Management**: Supports both environment variables and config files

### Scanning Schedule
- **Hardware & Software Scan**: Every 60 minutes
- **Telemetry Scan**: Every 10 minutes
- **Initial Scan**: Runs immediately on startup

## Architecture

### Class Structure

```python
class ITAMScannerBackground:
    def __init__(self):
        # Initialize hardware/software detectors
        # Setup logging system
        # Configure tenant settings
    
    def start(self):
        # Main service loop
        # Schedule tasks
        # Run initial scans
    
    def stop(self):
        # Graceful shutdown
        # Clear scheduled tasks
    
    def run_hardware_software_scan(self):
        # Execute hardware detection
        # Execute software detection
        # Send data to API
    
    def run_telemetry_scan(self):
        # Collect system telemetry
        # Send to monitoring API
```

### Dependencies

```python
# Core Python modules
import time, threading, schedule, sys, os, signal, logging
from datetime import datetime

# External libraries
import requests, subprocess, ctypes

# Local modules
from hardware import HardwareDetector
from software import SoftwareDetector
from telemetry import send_telemetry
```

## Configuration

### Environment Variables

The service reads configuration from environment variables or a `config.env` file:

```bash
# Required configuration
TENANT_ID=your_tenant_id
API_TOKEN=your_api_token
API_BASE_URL=http://your-server:3000/api

# Optional configuration
HARDWARE_SOFTWARE_INTERVAL=60  # minutes
TELEMETRY_INTERVAL=10          # minutes
```

### Configuration File (`config.env`)

```ini
# ITAM Scanner Configuration
# Generated for tenant: your_tenant_id
# Generated at: 2025-01-18T10:30:00Z

TENANT_ID=your_tenant_id
API_TOKEN=your_secure_api_token
API_BASE_URL=http://your-server:3000/api

# This file is automatically read by the ITAM Scanner executable
# Do not modify or delete this file
```

### Configuration Priority

1. **Environment Variables** (highest priority)
2. **config.env file** (if exists)
3. **Default values** (lowest priority)

## Installation

### Prerequisites

- Windows 10/11 (64-bit)
- No Python installation required (standalone executable)
- Network access to ITAM server
- Administrator privileges (recommended)

### Installation Steps

1. **Download the Package**
   ```bash
   # Download from ITAM dashboard
   ITAM_Scanner_[tenant_id].zip
   ```

2. **Extract Files**
   ```bash
   # Extract to desired location
   C:\Program Files\ITAM Scanner\
   ├── ITAM_Scanner.exe
   ├── ITAM_Scanner_Background.exe
   ├── config.env
   └── install_scanner.bat
   ```

3. **Run Installation Script**
   ```bash
   # Run as administrator
   install_scanner.bat
   ```

4. **Start Background Service**
   ```bash
   # Run background version
   ITAM_Scanner_Background.exe
   ```

## Usage

### Starting the Service

```bash
# Method 1: Direct execution
ITAM_Scanner_Background.exe

# Method 2: With configuration override
set TENANT_ID=my_tenant
set API_TOKEN=my_token
ITAM_Scanner_Background.exe

# Method 3: Using config file
# Place config.env in same directory
ITAM_Scanner_Background.exe
```

### Stopping the Service

```bash
# Method 1: Task Manager
# Find "ITAM_Scanner_Background.exe" and end task

# Method 2: Command line
taskkill /f /im ITAM_Scanner_Background.exe

# Method 3: Signal handling (if running in terminal)
# Press Ctrl+C for graceful shutdown
```

### Running as Windows Service

For production deployments, consider using a service wrapper:

```python
# Example service wrapper
import win32serviceutil
import win32service
import win32event

class ITAMScannerService(win32serviceutil.ServiceFramework):
    _svc_name_ = "ITAMScanner"
    _svc_display_name_ = "ITAM Asset Scanner"
    
    def SvcDoRun(self):
        scanner = ITAMScannerBackground()
        scanner.start()
```

## API Reference

### ITAMScannerBackground Class

#### Constructor
```python
def __init__(self):
    """
    Initialize the background scanner service.
    
    Sets up:
    - Hardware and software detectors
    - Logging system
    - Configuration from environment/config file
    """
```

#### Methods

##### `start()`
```python
def start(self):
    """
    Start the background scanner service.
    
    Features:
    - Schedules hardware/software scans (60 min intervals)
    - Schedules telemetry scans (10 min intervals)
    - Runs initial scans immediately
    - Enters main service loop
    """
```

##### `stop()`
```python
def stop(self):
    """
    Stop the background scanner service.
    
    Features:
    - Graceful shutdown
    - Clears scheduled tasks
    - Stops main loop
    """
```

##### `run_hardware_software_scan()`
```python
def run_hardware_software_scan(self):
    """
    Execute hardware and software scanning.
    
    Process:
    1. Run hardware detection
    2. Send hardware data to API
    3. Run software detection
    4. Send software data to API
    5. Log results
    """
```

##### `run_telemetry_scan()`
```python
def run_telemetry_scan(self):
    """
    Execute telemetry collection and transmission.
    
    Process:
    1. Collect system telemetry
    2. Send to monitoring API
    3. Log results
    """
```

### Signal Handlers

```python
def signal_handler(signum, frame):
    """
    Handle system signals for graceful shutdown.
    
    Supported signals:
    - SIGINT (Ctrl+C)
    - SIGTERM (Termination request)
    """
```

### Console Window Management

```python
def hide_console():
    """
    Hide the console window on Windows.
    
    Uses Windows API to hide console window
    for true background operation.
    """
```

## Logging

### Log File Location
```
logs/itam_scanner_background.log
```

### Log Format
```
2025-01-18 10:30:15,123 - INFO - ITAM Scanner Background initialized for tenant: tenant_123
2025-01-18 10:30:15,124 - INFO - API Base URL: http://localhost:3000/api
2025-01-18 10:30:15,125 - INFO - Starting ITAM Scanner Background...
2025-01-18 10:30:15,126 - INFO - Running initial scans...
2025-01-18 10:30:15,127 - INFO - Starting hardware and software scan...
```

### Log Levels
- **INFO**: General information and status updates
- **ERROR**: Error conditions and failures
- **WARNING**: Warning conditions (not errors)

### Log Rotation
Logs are written to a single file. For production, consider implementing log rotation:

```python
# Example log rotation setup
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'logs/itam_scanner_background.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

## Troubleshooting

### Common Issues

#### 1. Service Won't Start
**Problem**: Background service fails to start
**Solutions**:
- Check if `config.env` exists and is valid
- Verify network connectivity to API server
- Run as administrator
- Check Windows Event Viewer for errors

#### 2. No Data Being Sent
**Problem**: Scans run but no data reaches the server
**Solutions**:
- Verify API_TOKEN is correct
- Check API_BASE_URL is accessible
- Review network firewall settings
- Check logs for API errors

#### 3. High CPU Usage
**Problem**: Service consumes excessive CPU
**Solutions**:
- Check scan intervals (should be 60/10 minutes)
- Review hardware detection modules
- Monitor for infinite loops in logs

#### 4. Service Stops Unexpectedly
**Problem**: Service terminates without user action
**Solutions**:
- Check system resources (memory, disk)
- Review error logs
- Verify all dependencies are available
- Check for antivirus interference

### Debug Mode

Enable debug logging by modifying the logging level:

```python
# In itam_scanner_background.py
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler(log_file)]
)
```

### Health Check

Create a simple health check script:

```python
# health_check.py
import requests
import os

def check_scanner_health():
    """Check if scanner is running and healthy."""
    try:
        # Check if process is running
        import psutil
        for proc in psutil.process_iter(['pid', 'name']):
            if 'ITAM_Scanner_Background' in proc.info['name']:
                print("✅ Scanner process is running")
                return True
        print("❌ Scanner process not found")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    check_scanner_health()
```

## Development

### Building the Executable

```bash
# Build background executable
python build_exe.py

# Or build manually
python -m PyInstaller --onefile --noconsole --name ITAM_Scanner_Background itam_scanner_background.py
```

### Testing

```python
# Test configuration loading
def test_config_loading():
    scanner = ITAMScannerBackground()
    assert scanner.TENANT_ID is not None
    assert scanner.API_TOKEN is not None
    assert scanner.API_BASE_URL is not None

# Test signal handling
def test_signal_handling():
    scanner = ITAMScannerBackground()
    # Simulate SIGINT
    signal.signal(signal.SIGINT, signal_handler)
    # Test graceful shutdown
```

### Customization

#### Modify Scan Intervals
```python
# In itam_scanner_background.py
HARDWARE_SOFTWARE_INTERVAL = 30  # 30 minutes instead of 60
TELEMETRY_INTERVAL = 5           # 5 minutes instead of 10
```

#### Add Custom Logging
```python
# Add custom log messages
self.logger.info("Custom operation started")
self.logger.warning("Custom warning message")
self.logger.error("Custom error message")
```

#### Extend Functionality
```python
# Add new scanning methods
def run_custom_scan(self):
    """Custom scanning functionality."""
    self.logger.info("Running custom scan...")
    # Add your custom logic here
    pass

# Schedule custom scan
schedule.every(15).minutes.do(self.run_custom_scan)
```

## Security Considerations

### API Token Security
- Store API tokens securely
- Use environment variables when possible
- Rotate tokens regularly
- Never log sensitive information

### Network Security
- Use HTTPS for API communication
- Implement certificate validation
- Consider VPN for sensitive environments

### File Permissions
- Restrict access to configuration files
- Use least privilege principle
- Monitor file access logs

## Performance Optimization

### Memory Usage
- Monitor memory consumption
- Implement garbage collection if needed
- Use efficient data structures

### CPU Usage
- Optimize scan intervals
- Use threading for I/O operations
- Profile performance bottlenecks

### Network Optimization
- Batch API requests when possible
- Implement retry logic with exponential backoff
- Use connection pooling

## Monitoring and Alerting

### Health Monitoring
```python
# Add health check endpoint
def health_check(self):
    """Return service health status."""
    return {
        "status": "healthy" if self.running else "stopped",
        "last_scan": self.last_scan_time,
        "uptime": time.time() - self.start_time
    }
```

### Metrics Collection
```python
# Add metrics collection
def collect_metrics(self):
    """Collect service metrics."""
    return {
        "scans_completed": self.scan_count,
        "errors": self.error_count,
        "uptime": time.time() - self.start_time
    }
```

## License

This software is part of the ITAM (IT Asset Management) system. Please refer to the main project license for usage terms and conditions.

## Support

For technical support and questions:
1. Check the troubleshooting section
2. Review log files
3. Contact ITAM support team
4. Submit issues through the project repository

---

**Last Updated**: January 18, 2025  
**Version**: 1.0.0  
**Compatibility**: Windows 10/11 (64-bit)
