import fs from "fs";
import path from "path";
import archiver from "archiver";
import { generateTenantId } from "../utils/tenantUtils.js";
import { generateToken } from "../middleware/auth.js";

// Scanner download controller
export const downloadScanner = async (req, res) => {
  try {
    const { platform = "windows" } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Generate tenant-specific configuration
    const tenantId = user.tenant_id;
    const apiToken = generateToken(user._id);
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

    // Create platform-specific startup scripts
    if (platform === "windows") {
      createWindowsScripts(tempDir, tenantId, apiToken, apiBaseUrl);
    } else if (platform === "linux") {
      createLinuxScripts(tempDir, tenantId, apiToken, apiBaseUrl);
    } else if (platform === "macos") {
      createMacScripts(tempDir, tenantId, apiToken, apiBaseUrl);
    }

    // Create configuration file
    const configContent = `# ITAM Scanner Configuration
# Generated for tenant: ${tenantId}
# Generated at: ${new Date().toISOString()}

TENANT_ID=${tenantId}
API_TOKEN=${apiToken}
API_BASE_URL=${apiBaseUrl}

# Installation Instructions:
# 1. Extract all files to a directory
# 2. Install Python dependencies: pip install -r requirements.txt
# 3. Run the scanner:
#    - Windows: Double-click run_scanner.bat
#    - Linux/Mac: ./run_scanner.sh
# 4. The scanner will automatically send data to your organization's ITAM system

# Security Note: Keep this configuration file secure and do not share the API_TOKEN
`;

    fs.writeFileSync(path.join(tempDir, "config.env"), configContent);

    // Create README for the download
    const readmeContent = `# ITAM Scanner Package

This package contains the ITAM (IT Asset Management) scanner configured for your organization.

## Quick Start

1. **Install Python Dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. **Run the Scanner:**
   - **Windows:** Double-click \`run_scanner.bat\`
   - **Linux/Mac:** Run \`./run_scanner.sh\`

3. **Automatic Operation:**
   - Hardware and software scans run every 60 minutes
   - Telemetry data is collected every 10 minutes
   - Data is automatically sent to your organization's ITAM system

## Configuration

The scanner is pre-configured with your organization's settings:
- **Tenant ID:** ${tenantId}
- **API URL:** ${apiBaseUrl}
- **Authentication:** Pre-configured with secure token

## Files Included

- \`hardware.py\` - Hardware detection module
- \`software.py\` - Software detection module  
- \`telemetry.py\` - System monitoring module
- \`itam_scanner.py\` - Main scanner application
- \`run_scanner.bat\` - Windows startup script
- \`run_scanner.sh\` - Linux/Mac startup script
- \`config.env\` - Configuration file
- \`requirements.txt\` - Python dependencies

## Security

- The scanner uses secure authentication
- All data is encrypted in transit
- Configuration includes organization-specific tokens
- Do not share or modify the configuration files

## Support

For technical support, contact your IT administrator.

Generated for: ${user.firstName} ${user.lastName} (${user.email})
Organization: ${user.department || "N/A"}
Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(tempDir, "README_DOWNLOAD.md"), readmeContent);

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipPath = path.join(
      tempDir,
      `itam_scanner_${tenantId}_${platform}.zip`
    );

    const output = fs.createWriteStream(zipPath);
    archive.pipe(output);

    // Add files to archive
    archive.directory(tempDir, false);

    // Finalize archive
    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
      archive.finalize();
    });

    // Send the ZIP file
    res.download(zipPath, `itam_scanner_${tenantId}_${platform}.zip`, (err) => {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (err) {
        console.error("Download error:", err);
      }
    });
  } catch (error) {
    console.error("Scanner download error:", error);
    res.status(500).json({ error: "Failed to generate scanner package" });
  }
};

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
