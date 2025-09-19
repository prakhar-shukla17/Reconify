# ITAM Scanner Standalone Executable

## Overview

The ITAM Scanner is now available as a standalone executable that includes all Python dependencies. This means the scanner can run on any Windows machine without requiring Python to be installed.

## Key Features

- **Standalone**: Includes all Python dependencies bundled into a single .exe file
- **No Python Required**: Runs on any Windows machine without Python installation
- **Pre-configured**: Embedded with organization-specific settings and authentication
- **Background Operation**: Runs automatically in the background
- **Self-contained**: All required modules and libraries are included

## How It Works

### PyInstaller Configuration

The executable is built using PyInstaller with the `--onefile` option, which:

1. **Bundles all dependencies**: All Python packages (schedule, requests, psutil, etc.) are included
2. **Creates single file**: Everything is packaged into one executable file
3. **Includes Python runtime**: The Python interpreter is embedded in the executable
4. **Embeds modules**: All scanner modules (hardware.py, software.py, etc.) are included

### Build Process

1. **Copy scanner files** to temporary directory
2. **Create modified scanner** with embedded configuration
3. **Generate PyInstaller spec** with onefile option
4. **Run PyInstaller** with `--onefile --clean` flags
5. **Package executable** with installer script

### File Structure

```
ITAM_Scanner.exe          # Main executable (includes everything)
install_scanner.bat       # Windows installer script
```

## Technical Details

### Dependencies Included

- Python 3.x runtime
- schedule (task scheduling)
- requests (HTTP client)
- psutil (system information)
- GPUtil (GPU detection)
- All standard library modules

### Configuration

The executable is pre-configured with:
- Tenant ID
- API Token
- API Base URL
- Scan intervals
- Logging settings

### Size Considerations

The standalone executable will be larger (typically 50-100MB) because it includes:
- Python interpreter
- All required libraries
- Scanner modules
- Runtime dependencies

## Usage

### For End Users

1. Download the executable
2. Run `ITAM_Scanner.exe` directly, or
3. Run `install_scanner.bat` for installation

### For Administrators

1. Download from admin dashboard
2. Deploy to target machines
3. Executable runs automatically in background
4. No additional setup required

## Benefits

- **Zero Dependencies**: No Python installation required
- **Easy Deployment**: Single file distribution
- **Consistent Environment**: Same runtime across all machines
- **Reduced Support**: No Python version conflicts
- **Simplified Installation**: Just run the executable

## Limitations

- **Windows Only**: Currently only supports Windows platform
- **Larger File Size**: Includes all dependencies
- **Platform Specific**: Separate builds needed for different platforms

## Future Enhancements

- Linux executable support
- macOS executable support
- Code signing for security
- Auto-update mechanism
- Smaller executable size optimization
