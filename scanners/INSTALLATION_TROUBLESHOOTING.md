# ITAM Scanner Installation Troubleshooting

## Common Issues and Solutions

### 1. "Windows cannot find Files\lTAM Scanner\lTAM_Scanner.exe"

**Problem**: The installer creates a directory with incorrect path or the executable is not found.

**Solutions**:
1. **Run as Administrator**: Right-click the installer and select "Run as administrator"
2. **Check Installation Path**: The scanner should be installed to `C:\Program Files\ITAM Scanner\`
3. **Manual Installation**: If installer fails, manually copy files:
   - Extract the ZIP file
   - Create folder: `C:\Program Files\ITAM Scanner\`
   - Copy `ITAM_Scanner.exe` and `config.env` to this folder
   - Run `ITAM_Scanner.exe` from this location

### 2. "Access Denied" or "Permission Denied"

**Problem**: Insufficient permissions to install to Program Files.

**Solutions**:
1. **Run as Administrator**: Right-click installer → "Run as administrator"
2. **Alternative Location**: Install to a user folder like `C:\Users\[Username]\ITAM Scanner\`
3. **Check Antivirus**: Some antivirus software blocks executable installation

### 3. Scanner Doesn't Start

**Problem**: The executable runs but doesn't start scanning.

**Solutions**:
1. **Check Configuration**: Ensure `config.env` file is in the same folder as `ITAM_Scanner.exe`
2. **Check Network**: Ensure the scanner can reach the ITAM server
3. **Check Logs**: Look for log files in the scanner directory
4. **Run from Command Line**: Open Command Prompt and run the executable to see error messages

### 4. "Python not found" Error

**Problem**: This shouldn't happen with the standalone executable, but if it does:

**Solutions**:
1. **Redownload**: The executable might be corrupted, download again
2. **Check File Size**: Ensure the executable is ~16MB (not 0 bytes)
3. **Antivirus**: Check if antivirus software is blocking the executable

### 5. Scanner Stops Running

**Problem**: Scanner starts but stops after a few minutes.

**Solutions**:
1. **Check Configuration**: Verify `config.env` has correct settings
2. **Check Server**: Ensure ITAM server is running and accessible
3. **Check Logs**: Look for error messages in log files
4. **Run as Service**: Use the service installation option

## Manual Installation Steps

If the installer fails, follow these steps:

1. **Extract ZIP File**:
   ```
   Extract ITAM_Scanner_[tenant].zip to a folder
   ```

2. **Create Installation Directory**:
   ```
   Create folder: C:\Program Files\ITAM Scanner\
   ```

3. **Copy Files**:
   ```
   Copy ITAM_Scanner.exe to C:\Program Files\ITAM Scanner\
   Copy config.env to C:\Program Files\ITAM Scanner\
   ```

4. **Run Scanner**:
   ```
   Double-click ITAM_Scanner.exe or run from command line
   ```

## Verification Steps

To verify the installation is working:

1. **Check Files Exist**:
   - `C:\Program Files\ITAM Scanner\ITAM_Scanner.exe`
   - `C:\Program Files\ITAM Scanner\config.env`

2. **Run Scanner**:
   - Double-click the executable
   - Check for log messages
   - Verify it connects to the server

3. **Check Logs**:
   - Look for `logs` folder in the scanner directory
   - Check `itam_scanner.log` for any errors

## Support

If you continue to have issues:

1. **Check System Requirements**: Windows 10/11, sufficient disk space
2. **Check Network**: Ensure internet connection and server accessibility
3. **Contact IT Administrator**: Provide error messages and system details
4. **Check Server Logs**: Verify the ITAM server is running and accessible

## File Structure

After successful installation, you should have:

```
C:\Program Files\ITAM Scanner\
├── ITAM_Scanner.exe          # Main executable
├── config.env                # Configuration file
└── logs\                     # Log files (created when running)
    └── itam_scanner.log      # Scanner log file
```
