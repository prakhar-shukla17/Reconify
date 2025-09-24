#!/usr/bin/env python3
"""
Install missing dependencies for ITAM Scanner
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✓ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install {package}: {e}")
        return False

def main():
    """Install all required dependencies"""
    print("Installing ITAM Scanner dependencies...")
    
    # Read requirements from requirements.txt
    requirements_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
    
    if not os.path.exists(requirements_file):
        print("✗ requirements.txt not found!")
        return False
    
    with open(requirements_file, 'r') as f:
        packages = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    print(f"Found {len(packages)} packages to install:")
    for package in packages:
        print(f"  - {package}")
    
    print("\nInstalling packages...")
    
    success_count = 0
    for package in packages:
        if install_package(package):
            success_count += 1
    
    print(f"\nInstallation complete: {success_count}/{len(packages)} packages installed successfully")
    
    if success_count == len(packages):
        print("✓ All dependencies installed successfully!")
        return True
    else:
        print("✗ Some dependencies failed to install. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

