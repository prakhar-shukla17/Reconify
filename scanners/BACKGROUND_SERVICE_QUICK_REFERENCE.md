# ITAM Scanner Background Service - Quick Reference

## 🚀 Quick Start

### Installation
```bash
# 1. Download package from ITAM dashboard
ITAM_Scanner_[tenant_id].zip

# 2. Extract and run installer
install_scanner.bat

# 3. Start background service
ITAM_Scanner_Background.exe
```

### Configuration
```bash
# config.env file
TENANT_ID=your_tenant_id
API_TOKEN=your_api_token
API_BASE_URL=http://your-server:3000/api
```

## 📋 Commands

### Start Service
```bash
# Direct execution
ITAM_Scanner_Background.exe

# With environment variables
set TENANT_ID=my_tenant && ITAM_Scanner_Background.exe
```

### Stop Service
```bash
# Task Manager method
# Find "ITAM_Scanner_Background.exe" → End Task

# Command line method
taskkill /f /im ITAM_Scanner_Background.exe

# Graceful shutdown (if running in terminal)
Ctrl+C
```

### Check Status
```bash
# Check if running
tasklist | findstr ITAM_Scanner_Background

# Check logs
type logs\itam_scanner_background.log
```

## ⚙️ Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `TENANT_ID` | `default` | Your organization's tenant ID |
| `API_TOKEN` | `""` | Authentication token for API |
| `API_BASE_URL` | `http://localhost:3000/api` | ITAM server API endpoint |
| `HARDWARE_SOFTWARE_INTERVAL` | `60` | Hardware/software scan interval (minutes) |
| `TELEMETRY_INTERVAL` | `10` | Telemetry scan interval (minutes) |

## 📊 Monitoring

### Log Files
```
logs/itam_scanner_background.log
```

### Log Levels
- **INFO**: Normal operations
- **ERROR**: Error conditions
- **WARNING**: Warning conditions

### Key Log Messages
```
✅ "ITAM Scanner Background initialized"
✅ "Hardware scan completed successfully"
✅ "Software scan completed successfully"
✅ "Telemetry scan completed successfully"
❌ "Hardware scan failed: [error]"
❌ "Software scan failed: [error]"
❌ "Telemetry scan failed: [error]"
```

## 🔧 Troubleshooting

### Service Won't Start
1. Check `config.env` exists and is valid
2. Verify network connectivity
3. Run as administrator
4. Check Windows Event Viewer

### No Data Being Sent
1. Verify `API_TOKEN` is correct
2. Check `API_BASE_URL` is accessible
3. Review firewall settings
4. Check logs for API errors

### High CPU Usage
1. Check scan intervals
2. Review hardware detection
3. Monitor for infinite loops

### Service Stops Unexpectedly
1. Check system resources
2. Review error logs
3. Verify dependencies
4. Check antivirus settings

## 🛠️ Development

### Build Executable
```bash
# Using build script
python build_exe.py

# Manual build
python -m PyInstaller --onefile --noconsole --name ITAM_Scanner_Background itam_scanner_background.py
```

### Test Configuration
```python
# Test script
import os
print(f"TENANT_ID: {os.getenv('TENANT_ID')}")
print(f"API_TOKEN: {os.getenv('API_TOKEN')}")
print(f"API_BASE_URL: {os.getenv('API_BASE_URL')}")
```

## 📁 File Structure

```
scanners/
├── ITAM_Scanner_Background.exe    # Background executable
├── itam_scanner_background.py     # Source code
├── config.env                     # Configuration file
├── logs/                          # Log directory
│   └── itam_scanner_background.log
├── hardware.py                    # Hardware detection
├── software.py                    # Software detection
├── telemetry.py                   # Telemetry collection
└── utils.py                       # Utilities
```

## 🔒 Security

### Best Practices
- Store API tokens securely
- Use environment variables
- Rotate tokens regularly
- Use HTTPS for API communication
- Restrict file permissions

### File Permissions
```bash
# Restrict config file access
icacls config.env /grant:r "%USERNAME%:(R)"
icacls config.env /inheritance:r
```

## 📈 Performance

### Optimization Tips
- Monitor memory usage
- Optimize scan intervals
- Use efficient data structures
- Implement connection pooling

### Resource Usage
- **Memory**: ~50-100MB typical
- **CPU**: Low usage (scans every 60/10 minutes)
- **Disk**: Log files (~1-10MB per day)
- **Network**: Minimal (API calls only)

## 🚨 Alerts

### Health Check Script
```python
# health_check.py
import psutil
import os

def check_scanner():
    for proc in psutil.process_iter(['pid', 'name']):
        if 'ITAM_Scanner_Background' in proc.info['name']:
            print("✅ Scanner is running")
            return True
    print("❌ Scanner is not running")
    return False

if __name__ == "__main__":
    check_scanner()
```

### Monitoring Commands
```bash
# Check process
tasklist | findstr ITAM_Scanner_Background

# Check logs
tail -f logs\itam_scanner_background.log

# Check network connections
netstat -an | findstr :3000
```

## 📞 Support

### Quick Help
1. Check logs first: `logs\itam_scanner_background.log`
2. Verify configuration: `config.env`
3. Test network: `ping your-server`
4. Check process: `tasklist | findstr ITAM`

### Common Solutions
- **Permission denied**: Run as administrator
- **Network error**: Check firewall and connectivity
- **Config error**: Verify `config.env` format
- **Import error**: Ensure all files are in same directory

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: January 18, 2025
