#!/usr/bin/env python3
"""
Build script to create a standalone executable for ITAM Scanner
Uses PyInstaller to bundle all dependencies into a single .exe file
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def install_pyinstaller():
    """Install PyInstaller if not already installed."""
    try:
        import PyInstaller
        print("PyInstaller is already installed")
        return True
    except ImportError:
        print("Installing PyInstaller...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
            print("PyInstaller installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to install PyInstaller: {e}")
            return False


def build_executable():
    """Build the executable using PyInstaller."""
    print("Building executable...")
    
    # Clean previous builds
    if os.path.exists('build'):
        shutil.rmtree('build')
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    
    try:
        # Run PyInstaller with onefile option for standalone executable
        cmd = [
            sys.executable, "-m", "PyInstaller", 
            "--onefile", "--clean", 
            "--name", "ITAM_Scanner",
            "--add-data", "hardware.py;.",
            "--add-data", "software.py;.",
            "--add-data", "telemetry.py;.",
            "--add-data", "utils.py;.",
            "--add-data", "patch.py;.",
            "--add-data", "wi-blu.py;.",
            "--add-data", "latest_version.py;.",
            "--add-data", "compatibility_test.py;.",
            "--add-data", "test_mac.py;.",
            "--add-data", "generate_test_data.py;.",
            "--hidden-import", "schedule",
            "--hidden-import", "requests",
            "--hidden-import", "psutil",
            "--hidden-import", "GPUtil",
            "itam_scanner.py"
        ]
        subprocess.check_call(cmd)
        
        # Check if executable was created
        exe_path = Path("dist/ITAM_Scanner.exe")
        if exe_path.exists():
            print(f"✅ Executable created successfully: {exe_path}")
            print(f"File size: {exe_path.stat().st_size / (1024*1024):.1f} MB")
            return str(exe_path)
        else:
            print("❌ Executable not found after build")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return None

def build_background_executable():
    """Build the background executable using PyInstaller."""
    print("Building background executable...")
    
    # Clean previous builds
    if os.path.exists('build'):
        shutil.rmtree('build')
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    
    try:
        # Run PyInstaller with onefile option for background executable
        cmd = [
            sys.executable, "-m", "PyInstaller", 
            "--onefile", "--clean", 
            "--name", "ITAM_Scanner_Background",
            "--add-data", "hardware.py;.",
            "--add-data", "software.py;.",
            "--add-data", "telemetry.py;.",
            "--add-data", "utils.py;.",
            "--add-data", "patch.py;.",
            "--add-data", "wi-blu.py;.",
            "--add-data", "latest_version.py;.",
            "--add-data", "compatibility_test.py;.",
            "--add-data", "test_mac.py;.",
            "--add-data", "generate_test_data.py;.",
            "--hidden-import", "schedule",
            "--hidden-import", "requests",
            "--hidden-import", "psutil",
            "--hidden-import", "GPUtil",
            "--noconsole",  # This hides the console window
            "itam_scanner_background.py"
        ]
        subprocess.check_call(cmd)
        
        # Check if executable was created
        exe_path = Path("dist/ITAM_Scanner_Background.exe")
        if exe_path.exists():
            print(f"✅ Background executable created successfully: {exe_path}")
            print(f"File size: {exe_path.stat().st_size / (1024*1024):.1f} MB")
            return str(exe_path)
        else:
            print("❌ Background executable not found after build")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Background build failed: {e}")
        return None

def create_installer_script():
    """Create a simple installer script for the executable."""
    installer_content = '''@echo off
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
set "INSTALL_DIR=%PROGRAMFILES%\\ITAM Scanner"
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory: %INSTALL_DIR%
    mkdir "%INSTALL_DIR%"
)

REM Copy executable
echo Installing ITAM Scanner...
copy "ITAM_Scanner.exe" "%INSTALL_DIR%\\ITAM_Scanner.exe"

REM Create start menu shortcut
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs"
if not exist "%START_MENU%\\ITAM Scanner" (
    mkdir "%START_MENU%\\ITAM Scanner"
)

REM Create desktop shortcut
echo Creating shortcuts...
echo [InternetShortcut] > "%USERPROFILE%\\Desktop\\ITAM Scanner.url"
echo URL=file:///%INSTALL_DIR%\\ITAM_Scanner.exe >> "%USERPROFILE%\\Desktop\\ITAM Scanner.url"
echo IconFile=%INSTALL_DIR%\\ITAM_Scanner.exe >> "%USERPROFILE%\\Desktop\\ITAM Scanner.url"
echo IconIndex=0 >> "%USERPROFILE%\\Desktop\\ITAM Scanner.url"

echo.
echo Installation completed!
echo.
echo ITAM Scanner has been installed to: %INSTALL_DIR%
echo Desktop shortcut created.
echo.
echo To start the scanner, double-click the desktop shortcut or run:
echo "%INSTALL_DIR%\\ITAM_Scanner.exe"
echo.
echo The scanner will run in the background and automatically scan your system.
echo.
pause
'''
    
    with open('install_scanner.bat', 'w') as f:
        f.write(installer_content)
    print("Created installer script")

def main():
    """Main build process."""
    print("ITAM Scanner Executable Builder")
    print("==============================")
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('itam_scanner.py'):
        print("❌ Error: itam_scanner.py not found in current directory")
        print("Please run this script from the scanners directory")
        sys.exit(1)
    
    # Install PyInstaller
    if not install_pyinstaller():
        print("❌ Failed to install PyInstaller")
        sys.exit(1)
    
    # Build executables
    exe_path = build_executable()
    if not exe_path:
        print("❌ Failed to build executable")
        sys.exit(1)
    
    # Build background version
    background_exe_path = build_background_executable()
    if not background_exe_path:
        print("❌ Failed to build background executable")
        sys.exit(1)
    
    # Create installer script
    create_installer_script()
    
    print()
    print("🎉 Build completed successfully!")
    print(f"Executable: {exe_path}")
    print("Installer: install_scanner.bat")
    print()
    print("To test the executable:")
    print(f"1. Run: {exe_path}")
    print("2. Or run: install_scanner.bat (for installation)")
    print()
    print("The executable includes all dependencies and can run on any Windows machine")

if __name__ == "__main__":
    main()
