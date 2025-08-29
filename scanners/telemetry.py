import psutil
import platform
import requests
from datetime import datetime
import uuid
import socket
import os

# Import shared utilities
try:
    from utils import get_consistent_mac_address, get_system_identifier
except ImportError:
    # Fallback if utils module is not available
    def get_consistent_mac_address():
        return "Unknown"
    def get_system_identifier():
        return {
            'hostname': platform.node(),
            'mac_address': "Unknown",
            'system_id': f"{platform.node()}_Unknown"
        }

# Tenant configuration - these will be set by the download system
TENANT_ID = os.getenv('TENANT_ID', 'default')
API_TOKEN = os.getenv('API_TOKEN', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

# Check if psutil is available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

def get_mac_address():
    """Get MAC address using shared utility for consistency."""
    return get_consistent_mac_address()


def get_system_usage():
    """Fetch cpu, ram, storage usage percentages and MAC address."""
    cpu_percent = round(psutil.cpu_percent(interval=1), 1)
    ram_percent = round(psutil.virtual_memory().percent, 1)

    total_size = 0
    total_used = 0
    for partition in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            total_size += usage.total
            total_used += usage.used
        except:
            continue
    storage_percent = round((total_used / total_size) * 100, 1) if total_size > 0 else 0.0

    mac_address = get_mac_address()

    telemetry_data = {
        "timestamp": datetime.now().isoformat(),        
        "mac_address": mac_address,
        "cpu_percent": cpu_percent,
        "ram_percent": ram_percent,
        "storage_percent": storage_percent,
        "tenant_id": TENANT_ID  # Add tenant ID to telemetry data
    }
    return telemetry_data


def send_telemetry(api_url):
    data = get_system_usage()
    print(data)
    try:
        headers = {'Authorization': f'Bearer {API_TOKEN}'}
        response = requests.post(api_url, json=data, headers=headers, timeout=10)
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text,
            "data": data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Example usage: replace URL with your API endpoint
    result = send_telemetry("http://localhost:3000/api/telemetry")
    print("Telemetry Result:", result)
    # Result holds success status, response, and data
