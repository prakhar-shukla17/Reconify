# ITAM Scanner Deployment Guide

## Overview
This guide explains how to deploy the ITAM Scanner executable to client machines and resolve common issues.

## Issues Fixed

### 1. Schedule Module Error
**Problem**: "schedule module not found" error on line 9
**Solution**: Updated PyInstaller configuration to properly include schedule module and its submodules:
- Added `--hidden-import schedule.job`
- Added `--hidden-import schedule.every` 
- Added `--collect-all schedule`

### 2. ITAM_scanner in dist folder
**Status**: This is expected behavior. PyInstaller creates executables in the `dist` folder by default.

## Deployment Strategy

### Do you need to run build_exe on every endpoint?
**NO** - You only need to run `build_exe.py` once on your development machine. The resulting executable is portable and can be deployed to any Windows machine.

## Building the Executable

1. **Prerequisites**:
   ```bash
   pip install -r requirements.txt
   pip install pyinstaller
   ```

2. **Build the executable**:
   ```bash
   cd scanners
   python build_exe.py
   ```

3. **Output files**:
   - `dist/ITAM_Scanner.exe` - Console version (for testing/debugging)
   - `dist/ITAM_Scanner_Background.exe` - Background version (for production)
   - `install_scanner.bat` - Installation script

## Deployment to Client Machines

### Method 1: Direct Copy
1. Copy `ITAM_Scanner_Background.exe` to the client machine
2. Create a `config.env` file with:
   ```
   TENANT_ID=your_tenant_id
   API_TOKEN=your_api_token
   API_BASE_URL=http://your-server:3000/api
   ```
3. Place `config.env` in the same directory as the executable
4. Run the executable

### Method 2: Using Installer Script
1. Copy both `ITAM_Scanner_Background.exe` and `install_scanner.bat` to the client machine
2. Run `install_scanner.bat` as Administrator
3. The script will:
   - Install the scanner to `%PROGRAMFILES%\ITAM Scanner\`
   - Create desktop shortcut
   - Set up proper permissions

### Method 3: Automated Deployment
For enterprise deployment, you can:
1. Package the executable with a configuration file
2. Use Group Policy or deployment tools
3. Set up Windows Service (advanced)

## Configuration

### config.env File
Create a `config.env` file in the same directory as the executable:
```env
TENANT_ID=your_tenant_id_here
API_TOKEN=your_api_token_here
API_BASE_URL=http://your-server:3000/api
```

### Log Files
- Console version: Logs to console and `logs/itam_scanner.log`
- Background version: Logs to `logs/itam_scanner_background.log`

## Troubleshooting

### Common Issues

1. **"schedule module not found"**
   - Solution: Rebuild the executable with the updated `build_exe.py`
   - The new build includes proper schedule module bundling

2. **"config.env not found"**
   - Solution: Ensure `config.env` is in the same directory as the executable
   - Check file permissions and encoding (should be UTF-8)

3. **Permission errors**
   - Solution: Run as Administrator or use the installer script
   - Some hardware detection requires elevated privileges

4. **Network connectivity issues**
   - Solution: Verify API_BASE_URL is correct and accessible
   - Check firewall settings
   - Ensure API_TOKEN is valid

### Testing the Executable

1. **Test on development machine**:
   ```bash
   cd dist
   .\ITAM_Scanner.exe
   ```

2. **Test background version**:
   ```bash
   cd dist
   .\ITAM_Scanner_Background.exe
   ```

3. **Check logs**:
   - Look for "Scanner initialized" messages
   - Verify API connectivity
   - Monitor scan completion messages

## File Structure After Deployment

```
Client Machine:
├── ITAM_Scanner_Background.exe
├── config.env
└── logs/
    └── itam_scanner_background.log
```

## Security Considerations

1. **API Token Security**: Store API tokens securely
2. **Network Security**: Use HTTPS for API_BASE_URL in production
3. **File Permissions**: Restrict access to config.env file
4. **Log Security**: Ensure log files don't contain sensitive information

## Performance Notes

- **Memory Usage**: ~50-100MB typical
- **CPU Usage**: Minimal during idle, spikes during scans
- **Disk Usage**: ~100-200MB for executable + logs
- **Network**: Periodic API calls (configurable intervals)

## Support

For issues:
1. Check log files first
2. Verify configuration
3. Test network connectivity
4. Contact system administrator

## Version History

- v1.1: Fixed schedule module bundling issue
- v1.0: Initial release
