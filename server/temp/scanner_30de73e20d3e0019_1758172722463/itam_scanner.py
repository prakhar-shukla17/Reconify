#!/usr/bin/env python3
"""
ITAM Scanner - Automated Asset Management Scanner
Runs hardware and software scans at 1-hour intervals and telemetry at 10-minute intervals
Pre-configured for tenant: 30de73e20d3e0019
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
