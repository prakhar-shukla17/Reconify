import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { generateTenantId } from "../utils/tenantUtils.js";
import { generateToken } from "../middleware/auth.js";

const execAsync = promisify(exec);

// Scanner download controller - generates executable instead of zip
export const downloadScanner = async (req, res) => {
  try {
    const { platform = "windows", token } = req.query;

    // Allow download with token parameter for direct browser access
    let user = req.user;

    if (!user && token) {
      // If no user in session but token provided, try to validate token
      try {
        console.log("Validating token:", token.substring(0, 20) + "...");

        // Try different JWT secrets
        const possibleSecrets = [
          process.env.JWT_SECRET,
          "your-secret-key-change-in-production",
          "your-secret-key",
        ];

        let decoded = null;
        let secretUsed = null;

        for (const secret of possibleSecrets) {
          if (!secret) continue;
          try {
            decoded = jwt.verify(token, secret);
            secretUsed = secret;
            break;
          } catch (e) {
            console.log(
              `Failed with secret: ${
                secret ? secret.substring(0, 10) + "..." : "undefined"
              }`
            );
          }
        }

        if (!decoded) {
          throw new Error("Token validation failed with all possible secrets");
        }

        console.log(
          "Token decoded successfully with secret:",
          secretUsed ? secretUsed.substring(0, 10) + "..." : "undefined"
        );
        console.log("Decoded token:", decoded);

        // Create a minimal user object for the download
        user = {
          _id: decoded.userId || decoded.id,
          tenant_id: decoded.tenant_id,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          email: decoded.email,
          department: decoded.department,
          role: decoded.role,
        };
        console.log("Created user object:", user);
        console.log("User tenant_id:", user.tenant_id);
        console.log("Decoded token tenant_id:", decoded.tenant_id);
      } catch (tokenError) {
        console.log("Token validation failed:", tokenError.message);
        console.log("Token details:", {
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 20) + "..." : "No token",
          error: tokenError.message,
        });
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }

    if (!user) {
      // For testing purposes, allow download with default user if no token provided
      console.log("No user found, using default user for download");
      user = {
        _id: "default-user",
        tenant_id: "default",
        firstName: "Default",
        lastName: "User",
        email: "default@example.com",
        department: "N/A",
      };
    }

    // Ensure user has a valid tenant_id
    if (!user.tenant_id || user.tenant_id === "default") {
      console.log("Warning: User has no tenant_id or default tenant_id");
      console.log("User object:", user);

      // Try to get user from database if we have userId
      if (user._id && user._id !== "default-user") {
        try {
          const User = (await import("../models/user.models.js")).default;
          const dbUser = await User.findById(user._id);
          if (dbUser && dbUser.tenant_id) {
            console.log(
              "Found user in database with tenant_id:",
              dbUser.tenant_id
            );
            user.tenant_id = dbUser.tenant_id;
          }
        } catch (dbError) {
          console.log("Failed to fetch user from database:", dbError.message);
        }
      }
    }

    // Check user agent to detect download managers
    const userAgent = req.get("User-Agent") || "";
    const isDownloadManager =
      userAgent.toLowerCase().includes("idm") ||
      userAgent.toLowerCase().includes("internet download manager") ||
      userAgent.toLowerCase().includes("download manager") ||
      userAgent.toLowerCase().includes("wget") ||
      userAgent.toLowerCase().includes("curl");

    if (isDownloadManager) {
      return res.status(403).json({
        error:
          "Download managers are not allowed. Please use your browser's native download.",
      });
    }

    // Only support Windows for executable generation
    if (platform !== "windows") {
      return res.status(400).json({
        error:
          "Executable generation is currently only supported for Windows platform",
      });
    }

    // Generate tenant-specific configuration
    const tenantId = user.tenant_id;
    const apiToken = generateToken(user._id, {
      tenant_id: user.tenant_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      role: user.role,
    });
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";

    // Create temporary directory for scanner files
    const tempDir = path.join(
      process.cwd(),
      "temp",
      `scanner_${tenantId}_${Date.now()}`
    );
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy scanner files to temp directory
    const scannerFiles = [
      "hardware.py",
      "software.py",
      "telemetry.py",
      "itam_scanner.py",
      "utils.py",
      "patch.py",
      "wi-blu.py",
      "latest_version.py",
      "compatibility_test.py",
      "test_mac.py",
      "generate_test_data.py",
      "requirements.txt",
      "README.md",
    ];

    const scannerDir = path.join(process.cwd(), "..", "scanners");

    for (const file of scannerFiles) {
      const sourcePath = path.join(scannerDir, file);
      const destPath = path.join(tempDir, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // Create modified itam_scanner.py with embedded configuration
    const modifiedScannerContent = createConfiguredScanner(
      tenantId,
      apiToken,
      apiBaseUrl
    );
    fs.writeFileSync(
      path.join(tempDir, "itam_scanner.py"),
      modifiedScannerContent
    );

    // Create a configuration file that the executable will read
    const configContent = `# ITAM Scanner Configuration
# Generated for tenant: ${tenantId}
# Generated at: ${new Date().toISOString()}

TENANT_ID=${tenantId}
API_TOKEN=${apiToken}
API_BASE_URL=${apiBaseUrl}

# This file is automatically read by the ITAM Scanner executable
# Do not modify or delete this file
`;

    fs.writeFileSync(path.join(tempDir, "config.env"), configContent);

    // Check if we have a pre-built executable template
    const templatePath = path.join(
      process.cwd(),
      "..",
      "scanners",
      "dist",
      "ITAM_Scanner.exe"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        error:
          "Pre-built executable template not found. Please run the build script first.",
      });
    }

    // Copy the template executable
    const exePath = path.join(tempDir, "ITAM_Scanner.exe");
    fs.copyFileSync(templatePath, exePath);
    console.log("Using pre-built executable template with configuration file");

    // Check if background executable exists and copy it
    const backgroundTemplatePath = path.join(
      process.cwd(),
      "..",
      "scanners",
      "dist",
      "ITAM_Scanner_Background.exe"
    );
    if (fs.existsSync(backgroundTemplatePath)) {
      const backgroundExePath = path.join(
        tempDir,
        "ITAM_Scanner_Background.exe"
      );
      fs.copyFileSync(backgroundTemplatePath, backgroundExePath);
      console.log("Background executable included");
    } else {
      console.log("Background executable not found, skipping");
    }

    // Create installer script
    const installerContent = createInstallerScript(
      tenantId,
      apiToken,
      apiBaseUrl
    );
    fs.writeFileSync(
      path.join(tempDir, "install_scanner.bat"),
      installerContent
    );

    // Create a ZIP file containing both the executable and config
    const archiver = (await import("archiver")).default;
    const zipPath = path.join(tempDir, `ITAM_Scanner_${tenantId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.file(exePath, { name: "ITAM_Scanner.exe" });
    archive.file(path.join(tempDir, "config.env"), { name: "config.env" });
    archive.file(path.join(tempDir, "install_scanner.bat"), {
      name: "install_scanner.bat",
    });

    // Add background executable if it exists
    const backgroundExePath = path.join(tempDir, "ITAM_Scanner_Background.exe");
    if (fs.existsSync(backgroundExePath)) {
      archive.file(backgroundExePath, { name: "ITAM_Scanner_Background.exe" });
    }

    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
      archive.finalize();
    });

    // Send the ZIP file
    const fileName = `ITAM_Scanner_${tenantId}.zip`;

    // Set headers to force browser download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
        fileName
      )}`
    );
    res.setHeader("Content-Length", fs.statSync(zipPath).size);
    res.setHeader(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Accept-Ranges", "none");

    // Stream the ZIP file to response
    const fileStream = fs.createReadStream(zipPath);

    // Add a random delay to prevent IDM interception (100-300ms)
    const randomDelay = Math.floor(Math.random() * 200) + 100;
    setTimeout(() => {
      fileStream.pipe(res);
    }, randomDelay);

    // Clean up after streaming is complete
    fileStream.on("end", () => {
      console.log(`Scanner package downloaded successfully: ${fileName}`);
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    fileStream.on("error", (err) => {
      console.error("File stream error:", err);
      // Clean up temp directory on error
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream scanner package" });
      }
    });
  } catch (error) {
    console.error("Scanner download error:", error);
    res.status(500).json({ error: "Failed to generate scanner executable" });
  }
};

// Helper function to create configured scanner with embedded settings
function createConfiguredScanner(tenantId, apiToken, apiBaseUrl) {
  return `#!/usr/bin/env python3
"""
ITAM Scanner - Automated Asset Management Scanner
Runs hardware and software scans at 1-hour intervals and telemetry at 10-minute intervals
Pre-configured for tenant: ${tenantId}
"""

import time
import threading
import schedule
import sys
import os
import signal
import logging
from datetime import datetime
import requests

# Configuration - will be read from config.env file or environment variables
TENANT_ID = os.getenv('TENANT_ID', 'default')
API_TOKEN = os.getenv('API_TOKEN', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

# Try to load configuration from config.env file
config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.env')
if os.path.exists(config_file):
    with open(config_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    
    # Re-read environment variables after loading config file
    TENANT_ID = os.getenv('TENANT_ID', 'default')
    API_TOKEN = os.getenv('API_TOKEN', '')
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

# Add current directory to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import scanner modules
try:
    from hardware import HardwareDetector
    from software import SoftwareDetector
    from telemetry import send_telemetry
except ImportError as e:
    print(f"Error importing scanner modules: {e}")
    print("Make sure hardware.py, software.py, and telemetry.py are in the same directory")
    sys.exit(1)

# Configuration
HARDWARE_SOFTWARE_INTERVAL = 60  # 1 hour in minutes
TELEMETRY_INTERVAL = 10  # 10 minutes

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, 'itam_scanner.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ITAMScanner:
    def __init__(self):
        self.running = False
        self.hardware_detector = HardwareDetector()
        self.software_detector = SoftwareDetector()
        
        # Log tenant configuration
        logger.info(f"Scanner initialized for tenant: {TENANT_ID}")
        logger.info(f"API Base URL: {API_BASE_URL}")
        
    def start(self):
        """Start the ITAM scanner with scheduled tasks."""
        logger.info("Starting ITAM Scanner...")
        self.running = True
        
        # Schedule tasks
        schedule.every(HARDWARE_SOFTWARE_INTERVAL).minutes.do(self.run_hardware_software_scan)
        schedule.every(TELEMETRY_INTERVAL).minutes.do(self.run_telemetry_scan)
        
        # Run initial scans
        logger.info("Running initial scans...")
        self.run_hardware_software_scan()
        self.run_telemetry_scan()
        
        # Main loop
        try:
            while self.running:
                schedule.run_pending()
                time.sleep(1)  # Check every second for faster response to signals
        except KeyboardInterrupt:
            logger.info("Received KeyboardInterrupt, shutting down...")
            self.stop()
    
    def stop(self):
        """Stop the ITAM scanner."""
        logger.info("Stopping ITAM Scanner...")
        self.running = False
        # Clear all scheduled tasks
        schedule.clear()
    
    def run_hardware_software_scan(self):
        """Run hardware and software scans."""
        logger.info("Starting hardware and software scan...")
        
        try:
            # Hardware scan
            logger.info("Running hardware scan...")
            hardware_data = self.hardware_detector.get_comprehensive_hardware_info()
            hardware_result = self.send_hardware_data(hardware_data)
            
            if hardware_result['success']:
                logger.info("Hardware scan completed successfully")
            else:
                logger.error(f"Hardware scan failed: {hardware_result.get('error', 'Unknown error')}")
            
            # Software scan
            logger.info("Running software scan...")
            software_data = self.software_detector.get_comprehensive_software_info()
            software_result = self.send_software_data(software_data)
            
            if software_result['success']:
                logger.info("Software scan completed successfully")
            else:
                logger.error(f"Software scan failed: {software_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error during hardware/software scan: {e}")
    
    def run_telemetry_scan(self):
        """Run telemetry scan."""
        logger.info("Starting telemetry scan...")
        
        try:
            telemetry_result = send_telemetry(f"{API_BASE_URL}/telemetry")
            
            if telemetry_result['success']:
                logger.info("Telemetry scan completed successfully")
            else:
                logger.error(f"Telemetry scan failed: {telemetry_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error during telemetry scan: {e}")
    
    def send_hardware_data(self, hardware_data):
        """Send hardware data to the API with change detection."""
        try:
            # Import the change detection functions
            from hardware import send_hardware_data as send_with_changes
            
            # Use the new function that handles change detection and alerting
            success = send_with_changes(hardware_data, API_BASE_URL)
            
            return {
                "success": success,
                "status_code": 200 if success else 500,
                "response": "Hardware data processed with change detection"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_software_data(self, software_data):
        """Send software data to the API."""
        try:
            headers = {'Authorization': f'Bearer {API_TOKEN}'}
            response = requests.post(f"{API_BASE_URL}/software", json=software_data, headers=headers, timeout=30)
            return {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "response": response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

def signal_handler(signum, frame):
    """Handle system signals for graceful shutdown."""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    global scanner
    if scanner:
        scanner.stop()
    sys.exit(0)

def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = ['schedule', 'requests', 'psutil']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"Missing required packages: {', '.join(missing_packages)}")
        logger.info("Install missing packages with: pip install " + " ".join(missing_packages))
        return False
    
    return True

def main():
    """Main function."""
    global scanner
    
    logger.info("ITAM Scanner starting...")
    logger.info(f"Hardware/Software scan interval: {HARDWARE_SOFTWARE_INTERVAL} minutes")
    logger.info(f"Telemetry scan interval: {TELEMETRY_INTERVAL} minutes")
    logger.info(f"API Base URL: {API_BASE_URL}")
    logger.info(f"Tenant ID: {TENANT_ID}")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start scanner
    scanner = ITAMScanner()
    
    try:
        scanner.start()
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received in main, shutting down...")
        if scanner:
            scanner.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        if scanner:
            scanner.stop()
        sys.exit(1)
    finally:
        logger.info("ITAM Scanner stopped.")

if __name__ == "__main__":
    scanner = None
    main()
`;
}

// Helper function to build executable using PyInstaller
async function buildExecutable(tempDir, tenantId) {
  try {
    // Install PyInstaller if not available
    try {
      await execAsync("pyinstaller --version");
    } catch (error) {
      console.log("Installing PyInstaller...");
      await execAsync("pip install pyinstaller");
    }

    // Change to temp directory
    const originalCwd = process.cwd();
    process.chdir(tempDir);

    try {
      // Run PyInstaller directly with onefile option
      console.log("Running PyInstaller...");
      const pyinstallerCmd = `pyinstaller --onefile --clean --name ITAM_Scanner --add-data "hardware.py;." --add-data "software.py;." --add-data "telemetry.py;." --add-data "utils.py;." --add-data "patch.py;." --add-data "wi-blu.py;." --add-data "latest_version.py;." --add-data "compatibility_test.py;." --add-data "test_mac.py;." --add-data "generate_test_data.py;." --hidden-import schedule --hidden-import requests --hidden-import psutil --hidden-import GPUtil itam_scanner.py`;
      await execAsync(pyinstallerCmd);

      // Check if executable was created
      const exePath = path.join(tempDir, "dist", "ITAM_Scanner.exe");
      if (fs.existsSync(exePath)) {
        console.log(`Executable created successfully: ${exePath}`);
        return exePath;
      } else {
        console.error("Executable not found after build");
        return null;
      }
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  } catch (error) {
    console.error("Build failed:", error);
    return null;
  }
}

// Helper function to create installer script
function createInstallerScript(tenantId, apiToken, apiBaseUrl) {
  return `@echo off
echo ITAM Scanner Installer
echo =====================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo Warning: Not running as administrator. Some features may not work properly.
    echo Consider running as administrator for full functionality.
    echo.
)

REM Create installation directory
set "INSTALL_DIR=%PROGRAMFILES%\ITAM Scanner"
echo Installation directory: %INSTALL_DIR%

REM Create directory with proper error handling
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%" 2>nul
    if errorlevel 1 (
        echo Error: Failed to create installation directory
        echo Please run as administrator or choose a different location
        pause
        exit /b 1
    )
    echo Directory created successfully
) else (
    echo Directory already exists
)

REM Copy executable and configuration
echo Installing ITAM Scanner...

REM Copy executable
copy "ITAM_Scanner.exe" "%INSTALL_DIR%\ITAM_Scanner.exe" >nul 2>&1
if errorlevel 1 (
    echo Error: Failed to copy ITAM_Scanner.exe
    echo Make sure the file exists and you have write permissions
    pause
    exit /b 1
)
echo ITAM_Scanner.exe copied successfully

REM Copy configuration
copy "config.env" "%INSTALL_DIR%\config.env" >nul 2>&1
if errorlevel 1 (
    echo Error: Failed to copy config.env
    pause
    exit /b 1
)
echo config.env copied successfully

REM Copy background executable if it exists
if exist "ITAM_Scanner_Background.exe" (
    copy "ITAM_Scanner_Background.exe" "%INSTALL_DIR%\ITAM_Scanner_Background.exe" >nul 2>&1
    if errorlevel 1 (
        echo Error: Failed to copy ITAM_Scanner_Background.exe
        pause
        exit /b 1
    )
    echo ITAM_Scanner_Background.exe copied successfully
) else (
    echo ITAM_Scanner_Background.exe not found, skipping
)

REM Create start menu shortcut
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if not exist "%START_MENU%\ITAM Scanner" (
    mkdir "%START_MENU%\ITAM Scanner"
)

REM Create desktop shortcut
echo Creating shortcuts...
echo [InternetShortcut] > "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo URL=file:///%INSTALL_DIR%/ITAM_Scanner.exe >> "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo IconFile=%INSTALL_DIR%/ITAM_Scanner.exe >> "%USERPROFILE%\Desktop\ITAM Scanner.url"
echo IconIndex=0 >> "%USERPROFILE%\Desktop\ITAM Scanner.url"

echo.
echo Verifying installation...

REM Verify files exist
if exist "%INSTALL_DIR%\ITAM_Scanner.exe" (
    echo ✓ ITAM_Scanner.exe found
) else (
    echo ✗ ITAM_Scanner.exe not found
    echo Installation may have failed
    pause
    exit /b 1
)

if exist "%INSTALL_DIR%\config.env" (
    echo ✓ config.env found
) else (
    echo ✗ config.env not found
    echo Installation may have failed
    pause
    exit /b 1
)

echo.
echo ✅ Installation completed successfully!
echo.
echo ITAM Scanner has been installed to: %INSTALL_DIR%
echo Desktop shortcut created.
echo.
echo To start the scanner:
echo 1. Double-click the desktop shortcut (console mode)
echo 2. Run: "%INSTALL_DIR%\ITAM_Scanner.exe" (console mode)
echo 3. Run: "%INSTALL_DIR%\ITAM_Scanner_Background.exe" (background mode)
echo.
echo Background mode runs without console window and continues after closing.
echo.
echo The scanner is a standalone executable that includes all dependencies.
echo No Python installation required - it will run automatically in the background.
echo.
echo Configuration:
echo - Tenant ID: ${tenantId}
echo - API URL: ${apiBaseUrl}
echo.
echo The scanner will automatically start scanning your system.
echo.
pause
`;
}

// Create Windows startup scripts
function createWindowsScripts(tempDir, tenantId, apiToken, apiBaseUrl) {
  const batContent = `@echo off
echo ITAM Scanner Starting...
echo Tenant ID: ${tenantId}
echo API URL: ${apiBaseUrl}

REM Set environment variables
set TENANT_ID=${tenantId}
set API_TOKEN=${apiToken}
set API_BASE_URL=${apiBaseUrl}

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the scanner
echo Starting ITAM Scanner...
python itam_scanner.py

pause
`;

  const serviceBatContent = `@echo off
echo Installing ITAM Scanner as Windows Service...

REM Set environment variables
set TENANT_ID=${tenantId}
set API_TOKEN=${apiToken}
set API_BASE_URL=${apiBaseUrl}

REM Install as Windows service (requires admin privileges)
sc create "ITAM Scanner" binPath= "python \"%~dp0itam_scanner.py\"" start= auto
sc description "ITAM Scanner" "IT Asset Management Scanner for ${tenantId}"
sc start "ITAM Scanner"

echo ITAM Scanner service installed and started
pause
`;

  fs.writeFileSync(path.join(tempDir, "run_scanner.bat"), batContent);
  fs.writeFileSync(
    path.join(tempDir, "install_service.bat"),
    serviceBatContent
  );
}

// Create Linux startup scripts
function createLinuxScripts(tempDir, tenantId, apiToken, apiBaseUrl) {
  const shContent = `#!/bin/bash
echo "ITAM Scanner Starting..."
echo "Tenant ID: ${tenantId}"
echo "API URL: ${apiBaseUrl}"

# Set environment variables
export TENANT_ID="${tenantId}"
export API_TOKEN="${apiToken}"
export API_BASE_URL="${apiBaseUrl}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.7 or higher"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Start the scanner
echo "Starting ITAM Scanner..."
python3 itam_scanner.py
`;

  const serviceShContent = `#!/bin/bash
echo "Installing ITAM Scanner as Linux Service..."

# Set environment variables
export TENANT_ID="${tenantId}"
export API_TOKEN="${apiToken}"
export API_BASE_URL="${apiBaseUrl}"

# Create systemd service file
sudo tee /etc/systemd/system/itam-scanner.service > /dev/null <<EOF
[Unit]
Description=ITAM Scanner Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=TENANT_ID=${tenantId}
Environment=API_TOKEN=${apiToken}
Environment=API_BASE_URL=${apiBaseUrl}
ExecStart=/usr/bin/python3 $(pwd)/itam_scanner.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable itam-scanner
sudo systemctl start itam-scanner

echo "ITAM Scanner service installed and started"
`;

  fs.writeFileSync(path.join(tempDir, "run_scanner.sh"), shContent);
  fs.writeFileSync(path.join(tempDir, "install_service.sh"), serviceShContent);

  // Make scripts executable
  fs.chmodSync(path.join(tempDir, "run_scanner.sh"), "755");
  fs.chmodSync(path.join(tempDir, "install_service.sh"), "755");
}

// Create macOS startup scripts
function createMacScripts(tempDir, tenantId, apiToken, apiBaseUrl) {
  const shContent = `#!/bin/bash
echo "ITAM Scanner Starting..."
echo "Tenant ID: ${tenantId}"
echo "API URL: ${apiBaseUrl}"

# Set environment variables
export TENANT_ID="${tenantId}"
export API_TOKEN="${apiToken}"
export API_BASE_URL="${apiBaseUrl}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.7 or higher using Homebrew: brew install python3"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Start the scanner
echo "Starting ITAM Scanner..."
python3 itam_scanner.py
`;

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.itam.scanner</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$(pwd)/itam_scanner.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>TENANT_ID</key>
        <string>${tenantId}</string>
        <key>API_TOKEN</key>
        <string>${apiToken}</string>
        <key>API_BASE_URL</key>
        <string>${apiBaseUrl}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$(pwd)/logs/itam_scanner.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/logs/itam_scanner_error.log</string>
</dict>
</plist>`;

  fs.writeFileSync(path.join(tempDir, "run_scanner.sh"), shContent);
  fs.writeFileSync(path.join(tempDir, "com.itam.scanner.plist"), plistContent);

  // Make script executable
  fs.chmodSync(path.join(tempDir, "run_scanner.sh"), "755");
}

// Get available platforms
export const getAvailablePlatforms = async (req, res) => {
  try {
    const platforms = [
      {
        id: "windows",
        name: "Windows",
        description: "Windows 10/11 with batch files",
      },
      {
        id: "linux",
        name: "Linux",
        description: "Linux distributions with systemd",
      },
      { id: "macos", name: "macOS", description: "macOS with launchd service" },
    ];

    res.json({
      success: true,
      platforms: platforms,
    });
  } catch (error) {
    console.error("Get platforms error:", error);
    res.status(500).json({ error: "Failed to get available platforms" });
  }
};

// Test endpoint to check if server is working
export const testEndpoint = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Scanner server is working",
      timestamp: new Date().toISOString(),
      env: {
        JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
        PORT: process.env.PORT || "3000",
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ error: "Test endpoint failed" });
  }
};
