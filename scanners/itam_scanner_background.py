#!/usr/bin/env python3
"""
ITAM Scanner Background Runner
Runs the scanner in the background without console window
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
import subprocess
import ctypes
from ctypes import wintypes

# Configuration - will be read from config.env file or environment variables
TENANT_ID = os.getenv('TENANT_ID', 'default')
API_TOKEN = os.getenv('API_TOKEN', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

# Try to load configuration from config.env file
# Check multiple possible locations for config.env
config_locations = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.env'),  # Same directory as script
    os.path.join(os.getcwd(), 'config.env'),  # Current working directory
    os.path.join(os.path.dirname(os.path.abspath(sys.executable)), 'config.env'),  # Same directory as executable
    'config.env'  # Current directory
]

config_loaded = False
for config_file in config_locations:
    if os.path.exists(config_file):
        print(f"Loading configuration from: {config_file}")
        try:
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
            config_loaded = True
            print(f"Configuration loaded successfully. Tenant ID: {TENANT_ID}")
            break
        except Exception as e:
            print(f"Error loading config from {config_file}: {e}")
            continue

if not config_loaded:
    print("Warning: No config.env file found. Using default configuration.")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")
    print(f"Executable directory: {os.path.dirname(os.path.abspath(sys.executable))}")

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

def hide_console():
    """Hide the console window on Windows"""
    try:
        import ctypes
        from ctypes import wintypes
        
        # Get console window handle
        kernel32 = ctypes.windll.kernel32
        user32 = ctypes.windll.user32
        
        # Hide console window
        console_window = kernel32.GetConsoleWindow()
        if console_window:
            user32.ShowWindow(console_window, 0)  # SW_HIDE = 0
    except:
        pass  # Ignore errors on non-Windows systems

class ITAMScannerBackground:
    def __init__(self):
        self.running = False
        self.hardware_detector = HardwareDetector()
        self.software_detector = SoftwareDetector()
        
        # Setup logging
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        log_file = os.path.join(log_dir, 'itam_scanner_background.log')
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Log tenant configuration
        self.logger.info(f"ITAM Scanner Background initialized for tenant: {TENANT_ID}")
        self.logger.info(f"API Base URL: {API_BASE_URL}")
        
    def start(self):
        """Start the ITAM scanner with scheduled tasks."""
        self.logger.info("Starting ITAM Scanner Background...")
        self.running = True
        
        # Schedule tasks
        schedule.every(HARDWARE_SOFTWARE_INTERVAL).minutes.do(self.run_hardware_software_scan)
        schedule.every(TELEMETRY_INTERVAL).minutes.do(self.run_telemetry_scan)
        
        # Run initial scans
        self.logger.info("Running initial scans...")
        self.run_hardware_software_scan()
        self.run_telemetry_scan()
        
        # Main loop
        try:
            while self.running:
                schedule.run_pending()
                time.sleep(1)  # Check every second for faster response to signals
        except KeyboardInterrupt:
            self.logger.info("Received KeyboardInterrupt, shutting down...")
            self.stop()
    
    def stop(self):
        """Stop the ITAM scanner."""
        self.logger.info("Stopping ITAM Scanner Background...")
        self.running = False
        schedule.clear()
    
    def run_hardware_software_scan(self):
        """Run hardware and software scans."""
        self.logger.info("Starting hardware and software scan...")
        
        try:
            # Hardware scan
            self.logger.info("Running hardware scan...")
            hardware_data = self.hardware_detector.get_comprehensive_hardware_info()
            hardware_result = self.send_hardware_data(hardware_data)
            
            if hardware_result['success']:
                self.logger.info("Hardware scan completed successfully")
            else:
                self.logger.error(f"Hardware scan failed: {hardware_result.get('error', 'Unknown error')}")
            
            # Software scan
            self.logger.info("Running software scan...")
            software_data = self.software_detector.get_comprehensive_software_info()
            software_result = self.send_software_data(software_data)
            
            if software_result['success']:
                self.logger.info("Software scan completed successfully")
            else:
                self.logger.error(f"Software scan failed: {software_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.logger.error(f"Error during hardware/software scan: {e}")
    
    def run_telemetry_scan(self):
        """Run telemetry scan."""
        self.logger.info("Starting telemetry scan...")
        
        try:
            telemetry_result = send_telemetry(f"{API_BASE_URL}/telemetry")
            
            if telemetry_result['success']:
                self.logger.info("Telemetry scan completed successfully")
            else:
                self.logger.error(f"Telemetry scan failed: {telemetry_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.logger.error(f"Error during telemetry scan: {e}")
    
    def send_hardware_data(self, hardware_data):
        """Send hardware data to the API with change detection."""
        try:
            from hardware import send_hardware_data as send_with_changes
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

def main():
    """Main function."""
    global scanner
    
    # Hide console window on Windows
    if sys.platform == "win32":
        hide_console()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start scanner
    scanner = ITAMScannerBackground()
    
    try:
        scanner.start()
    except KeyboardInterrupt:
        if scanner:
            scanner.stop()
    except Exception as e:
        if scanner:
            scanner.stop()
        sys.exit(1)
    finally:
        if scanner:
            scanner.stop()

if __name__ == "__main__":
    scanner = None
    main()
