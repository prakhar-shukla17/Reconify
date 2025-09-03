# ITAM Scanner Package

This package contains the ITAM (IT Asset Management) scanner configured for your organization.

## Quick Start

1. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Scanner:**
   - **Windows:** Double-click `run_scanner.bat`
   - **Linux/Mac:** Run `./run_scanner.sh`

3. **Automatic Operation:**
   - Hardware and software scans run every 60 minutes
   - Telemetry data is collected every 10 minutes
   - Data is automatically sent to your organization's ITAM system

## Configuration

The scanner is pre-configured with your organization's settings:
- **Tenant ID:** fb8e20fc2e4c3f24
- **API URL:** http://localhost:3000/api
- **Authentication:** Pre-configured with secure token

## Files Included

- `hardware.py` - Hardware detection module
- `software.py` - Software detection module  
- `telemetry.py` - System monitoring module
- `itam_scanner.py` - Main scanner application
- `run_scanner.bat` - Windows startup script
- `run_scanner.sh` - Linux/Mac startup script
- `config.env` - Configuration file
- `requirements.txt` - Python dependencies

## Security

- The scanner uses secure authentication
- All data is encrypted in transit
- Configuration includes organization-specific tokens
- Do not share or modify the configuration files

## Support

For technical support, contact your IT administrator.

Generated for: Shivam Mohit (smsingh0000@gmail.com)
Organization: N/A
Generated: 2025-09-03T04:32:37.503Z
