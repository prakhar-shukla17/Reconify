# ITAM Scanner - Automated Asset Management Scanner

This scanner automatically collects hardware, software, and telemetry data from target machines and sends it to the ITAM API server.

## Features

- **Hardware Scanning**: Comprehensive hardware information collection
- **Software Scanning**: Installed software, services, and startup programs
- **Telemetry Monitoring**: Real-time system usage metrics
- **Automated Scheduling**: Runs scans at specified intervals
- **Cross-Platform**: Works on Windows, Linux, and macOS
- **Logging**: Detailed logging for monitoring and debugging

## Scan Intervals

- **Hardware & Software Scans**: Every 60 minutes (1 hour)
- **Telemetry Scans**: Every 10 minutes

## Requirements

- Python 3.7 or higher
- Required Python packages (see requirements.txt)

## Installation

1. **Clone or download the scanner files** to the target machine
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Windows
```bash
# Double-click the batch file
run_itam_scanner.bat

# Or run from command line
python itam_scanner.py
```

### Linux/macOS
```bash
# Make the script executable
chmod +x run_itam_scanner.sh

# Run the script
./run_itam_scanner.sh

# Or run directly
python3 itam_scanner.py
```

## Configuration

Edit `itam_scanner.py` to modify:

- **API Base URL**: Change `API_BASE_URL` to point to your ITAM server
- **Scan Intervals**: Modify `HARDWARE_SOFTWARE_INTERVAL` and `TELEMETRY_INTERVAL`
- **Logging**: Adjust logging level and file location

## Files Description

- `itam_scanner.py` - Main scanner executable
- `hardware.py` - Hardware detection module
- `software.py` - Software detection module
- `telemetry.py` - Telemetry collection module
- `utils.py` - Shared utilities for consistent MAC address generation
- `requirements.txt` - Python dependencies
- `run_itam_scanner.bat` - Windows batch file
- `run_itam_scanner.sh` - Linux/macOS shell script
- `itam_scanner.log` - Log file (created when running)

## MAC Address Consistency

All scanners now use a shared utility (`utils.py`) to ensure they generate the same MAC address for the same system. This ensures that:

- Hardware and software data are properly linked
- Telemetry data is associated with the correct asset
- Asset tracking is consistent across all scanners

The shared MAC address generation:
1. First tries to get a real MAC address from network interfaces
2. Falls back to `uuid.getnode()` for consistency
3. Ensures all scanners use the same logic and format

## API Endpoints

The scanner sends data to these endpoints:

- **Hardware**: `POST /api/hardware`
- **Software**: `POST /api/software`
- **Telemetry**: `POST /api/telemetry`

## Logging

The scanner creates detailed logs in `itam_scanner.log` including:

- Scan start/completion times
- Success/failure status
- Error messages
- API response details

## Stopping the Scanner

- **Windows**: Press `Ctrl+C` in the command window
- **Linux/macOS**: Press `Ctrl+C` in the terminal
- **Service**: Send SIGTERM signal

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all required packages are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **API Connection Errors**: Check that the ITAM server is running and accessible

3. **Permission Errors**: Run with appropriate permissions for system information access

4. **Missing Dependencies**: Install missing system packages:
   - **Windows**: No additional packages needed
   - **Linux**: May need `dmidecode`, `lshw` for enhanced hardware detection
   - **macOS**: No additional packages needed

### Debug Mode

To run with verbose logging, modify the logging level in `itam_scanner.py`:
```python
logging.basicConfig(level=logging.DEBUG, ...)
```

## Security Considerations

- The scanner requires system access to collect hardware/software information
- Ensure the API server is properly secured
- Consider using HTTPS for API communication
- Review and restrict file system access as needed

## Support

For issues or questions:
1. Check the log file for error details
2. Verify API server connectivity
3. Ensure all dependencies are installed
4. Check system permissions
