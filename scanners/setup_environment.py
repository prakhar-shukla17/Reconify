#!/usr/bin/env python3
"""
ITAM Scanner Environment Setup
Sets up the environment for the ITAM Scanner to run properly
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def create_config_env():
    """Create a default config.env file if it doesn't exist"""
    config_file = Path("config.env")
    
    if config_file.exists():
        print("✓ config.env already exists")
        return True
    
    print("Creating default config.env file...")
    
    default_config = """# ITAM Scanner Configuration
# Copy this file and update with your actual values

# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TOKEN=your_api_token_here
TENANT_ID=default

# Scanner Configuration
SCAN_INTERVAL_MINUTES=60
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_SECONDS=30

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=scanner.log
LOG_MAX_SIZE_MB=10
LOG_BACKUP_COUNT=5

# Performance Configuration
MAX_CPU_USAGE_PERCENT=80
MAX_MEMORY_USAGE_PERCENT=80
SCAN_TIMEOUT_SECONDS=300

# Network Configuration
REQUEST_TIMEOUT_SECONDS=30
CONNECTION_POOL_SIZE=10
"""
    
    try:
        with open(config_file, 'w') as f:
            f.write(default_config)
        print("✓ Created config.env file")
        return True
    except Exception as e:
        print(f"✗ Failed to create config.env: {e}")
        return False

def install_dependencies():
    """Install required Python packages"""
    print("Installing Python dependencies...")
    
    requirements = [
        "schedule==1.2.0",
        "requests==2.31.0",
        "psutil==5.9.5",
        "GPUtil==1.4.0"
    ]
    
    success_count = 0
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✓ Installed {package}")
            success_count += 1
        except subprocess.CalledProcessError:
            print(f"✗ Failed to install {package}")
    
    return success_count == len(requirements)

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print(f"✗ Python {version.major}.{version.minor} is not supported. Please use Python 3.7 or higher.")
        return False
    
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def create_directories():
    """Create necessary directories"""
    directories = ["logs", "temp", "backups"]
    
    for directory in directories:
        try:
            Path(directory).mkdir(exist_ok=True)
            print(f"✓ Created directory: {directory}")
        except Exception as e:
            print(f"✗ Failed to create directory {directory}: {e}")
            return False
    
    return True

def test_imports():
    """Test if all required modules can be imported"""
    modules = ["schedule", "requests", "psutil", "GPUtil"]
    
    for module in modules:
        try:
            __import__(module)
            print(f"✓ Successfully imported {module}")
        except ImportError as e:
            print(f"✗ Failed to import {module}: {e}")
            return False
    
    return True

def main():
    """Main setup function"""
    print("ITAM Scanner Environment Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Create directories
    if not create_directories():
        return False
    
    # Install dependencies
    if not install_dependencies():
        print("\n⚠ Some dependencies failed to install. Trying alternative method...")
        # Try installing from requirements.txt
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✓ Successfully installed from requirements.txt")
        except subprocess.CalledProcessError:
            print("✗ Failed to install from requirements.txt")
            return False
    
    # Test imports
    if not test_imports():
        return False
    
    # Create config file
    if not create_config_env():
        return False
    
    print("\n" + "=" * 40)
    print("✓ Environment setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit config.env with your actual API configuration")
    print("2. Run the scanner: python itam_scanner_background.py")
    print("3. Check logs/scanner.log for any issues")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

