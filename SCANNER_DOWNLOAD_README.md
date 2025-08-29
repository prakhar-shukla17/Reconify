# ITAM Scanner Download System

## Overview

The ITAM Scanner Download System provides a secure, tenant-specific way for administrators to download pre-configured scanner packages for their organization. Each downloaded package includes the organization's unique tenant ID and authentication tokens, ensuring proper data isolation and security.

## Features

### 🔐 **Tenant-Specific Configuration**
- **Unique Tenant ID**: Each scanner package is configured with the organization's specific tenant ID
- **Secure Authentication**: Pre-configured JWT tokens for secure API communication
- **Data Isolation**: Ensures scanners only send data to the correct tenant's system
- **Organization Branding**: Customized installation instructions and documentation

### 📦 **Platform Support**
- **Windows**: Batch files and Windows service installation
- **Linux**: Shell scripts and systemd service files
- **macOS**: Shell scripts and launchd plist files

### 🛡️ **Security Features**
- **Secure Token Generation**: JWT tokens with proper expiration
- **Environment Variables**: Secure configuration through environment variables
- **Tenant Validation**: Backend validates tenant access for all scanner requests
- **Audit Trail**: All downloads are logged with user and tenant information

## How It Works

### 1. **Admin Request**
- Admin logs into the ITAM system
- Navigates to Admin Dashboard → Download Scanner
- Selects target platform (Windows/Linux/macOS)
- Clicks "Download Scanner Package"

### 2. **Package Generation**
- Backend generates tenant-specific configuration
- Creates platform-specific startup scripts
- Packages all scanner files with configuration
- Creates ZIP archive with organization branding

### 3. **Secure Delivery**
- ZIP file contains pre-configured scanner
- Includes organization's tenant ID and API token
- Platform-specific installation scripts
- Comprehensive documentation

### 4. **Deployment**
- Admin extracts ZIP file on target machine
- Runs platform-specific installation script
- Scanner automatically connects to organization's ITAM system
- Data is isolated to the organization's tenant

## API Endpoints

### Get Available Platforms
```http
GET /api/scanner/platforms
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "platforms": [
    {
      "id": "windows",
      "name": "Windows",
      "description": "Windows 10/11 with batch files"
    },
    {
      "id": "linux", 
      "name": "Linux",
      "description": "Linux distributions with systemd"
    },
    {
      "id": "macos",
      "name": "macOS", 
      "description": "macOS with launchd service"
    }
  ]
}
```

### Download Scanner Package
```http
GET /api/scanner/download?platform=windows
Authorization: Bearer <token>
```

**Response:** ZIP file containing scanner package

## Scanner Package Contents

### Core Files
- `hardware.py` - Hardware detection module
- `software.py` - Software detection module
- `telemetry.py` - System monitoring module
- `itam_scanner.py` - Main scanner application
- `requirements.txt` - Python dependencies
- `README.md` - Scanner documentation

### Platform-Specific Files
- `run_scanner.bat` - Windows startup script
- `run_scanner.sh` - Linux/macOS startup script
- `install_service.bat` - Windows service installation
- `install_service.sh` - Linux service installation
- `com.itam.scanner.plist` - macOS launchd configuration

### Configuration Files
- `config.env` - Environment variables with tenant configuration
- `README_DOWNLOAD.md` - Organization-specific installation guide

## Configuration Structure

### Environment Variables
```bash
# Generated automatically for each organization
TENANT_ID=abc123def4567890
API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_BASE_URL=http://localhost:3000/api
```

### Scanner Data Structure
```python
# Hardware scanner includes tenant info
hardware_data = {
    'system': { ... },
    'cpu': { ... },
    'memory': { ... },
    'tenant_info': {
        'tenant_id': 'abc123def4567890',
        'scanner_version': '2.0',
        'configured_at': '2024-01-01T10:00:00Z'
    }
}
```

## Installation Instructions

### Windows Installation
1. Extract the ZIP file to a directory
2. Open Command Prompt as Administrator
3. Navigate to the extracted directory
4. Run: `run_scanner.bat`
5. For service installation: `install_service.bat`

### Linux Installation
1. Extract the ZIP file to a directory
2. Open Terminal
3. Navigate to the extracted directory
4. Make scripts executable: `chmod +x *.sh`
5. Run: `./run_scanner.sh`
6. For service installation: `sudo ./install_service.sh`

### macOS Installation
1. Extract the ZIP file to a directory
2. Open Terminal
3. Navigate to the extracted directory
4. Make scripts executable: `chmod +x *.sh`
5. Run: `./run_scanner.sh`
6. For service installation: Copy `com.itam.scanner.plist` to `~/Library/LaunchAgents/`

## Security Considerations

### Token Security
- **JWT Tokens**: Generated with 7-day expiration
- **Tenant Isolation**: Tokens are scoped to specific tenant
- **Secure Storage**: Tokens stored in environment variables
- **Automatic Rotation**: New tokens generated for each download

### Data Protection
- **Encrypted Transmission**: All API communication uses HTTPS
- **Tenant Validation**: Backend validates tenant access for all requests
- **Audit Logging**: All scanner activities are logged
- **Access Control**: Only admin users can download scanner packages

### Best Practices
- **Secure Distribution**: Share scanner packages through secure channels
- **Token Protection**: Do not share or modify configuration files
- **Regular Updates**: Download new packages when tokens expire
- **Network Security**: Ensure scanners can reach the ITAM API

## Troubleshooting

### Common Issues

#### Scanner Won't Start
- **Check Python**: Ensure Python 3.7+ is installed
- **Check Dependencies**: Run `pip install -r requirements.txt`
- **Check Permissions**: Ensure proper file permissions
- **Check Network**: Verify API endpoint accessibility

#### Authentication Errors
- **Token Expired**: Download new scanner package
- **Wrong Tenant**: Verify tenant ID configuration
- **Network Issues**: Check firewall and proxy settings
- **API Unavailable**: Verify ITAM server is running

#### Data Not Appearing
- **Tenant Mismatch**: Verify scanner tenant ID matches organization
- **API Connection**: Check network connectivity to ITAM server
- **Scanner Status**: Verify scanner is running and logging
- **Backend Issues**: Check ITAM server logs for errors

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export DEBUG=true
```

## Development

### Adding New Platforms
1. Update `scanner.controller.js` with new platform logic
2. Add platform-specific script generation functions
3. Update frontend platform selection
4. Test package generation and installation

### Customizing Packages
1. Modify script templates in controller
2. Add organization-specific branding
3. Include additional configuration files
4. Update documentation templates

### Security Enhancements
1. Implement token rotation
2. Add package signing
3. Implement download rate limiting
4. Add package integrity verification

## API Integration

### Frontend Integration
```javascript
import { scannerAPI } from '../lib/api';

// Get available platforms
const platforms = await scannerAPI.getPlatforms();

// Download scanner package
const response = await scannerAPI.downloadScanner('windows');
```

### Backend Integration
```javascript
import { downloadScanner, getAvailablePlatforms } from '../controllers/scanner.controller.js';

// Add routes
router.get('/platforms', verifyToken, getAvailablePlatforms);
router.get('/download', verifyToken, downloadScanner);
```

## Monitoring and Analytics

### Download Analytics
- Track download frequency by platform
- Monitor tenant usage patterns
- Analyze scanner deployment success rates
- Generate usage reports

### Security Monitoring
- Monitor token usage and expiration
- Track unauthorized access attempts
- Log scanner connection patterns
- Alert on suspicious activity

## Future Enhancements

### Planned Features
- **Package Signing**: Digital signatures for package integrity
- **Auto-Update**: Automatic scanner updates
- **Bulk Deployment**: Mass deployment tools
- **Custom Branding**: Organization-specific branding options
- **Advanced Security**: Multi-factor authentication for downloads

### Integration Opportunities
- **MDM Integration**: Mobile device management integration
- **SCCM Integration**: System Center Configuration Manager
- **Ansible Integration**: Infrastructure automation
- **Docker Support**: Containerized scanner deployment

---

**Note**: This scanner download system ensures secure, tenant-isolated deployment of ITAM scanners while maintaining proper data separation and access controls.
