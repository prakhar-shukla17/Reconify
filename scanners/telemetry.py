import psutil
import platform
import requests
from datetime import datetime
import uuid
import socket

# Check if psutil is available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

def get_mac_address():
    # Try to use psutil/net_if_addrs for best results
    mac = None
    if PSUTIL_AVAILABLE:
        for iface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                # Ensure address has the expected format
                if hasattr(addr, 'address'):
                    mac_addr = addr.address
                    # Check for MAC address pattern: 6 groups of 2 hex digits separated by ':'
                    if len(mac_addr.split(':')) == 6 and mac_addr != "00:00:00:00:00:00":
                        mac = mac_addr
                        break
            if mac:
                break
    if not mac:
        # Fallback: use uuid.getnode and format
        mac_int = uuid.getnode()
        mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff) for i in range(40, -1, -8)])
        if mac == "00:00:00:00:00:00":
            mac = "Unknown"
    # Ensure uppercase
    return mac.upper()


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
        "storage_percent": storage_percent
    }
    return telemetry_data


def send_telemetry(api_url):
    data = get_system_usage()
    print(data)
    try:
        response = requests.post(api_url, json=data, timeout=10)
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text,
            "data": data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Example usage: replace URL with your API endpoint
result = send_telemetry("http://localhost:3000/api/telemetry")
# Result holds success status, response, and data
