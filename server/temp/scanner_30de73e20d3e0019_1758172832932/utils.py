import uuid
import psutil
import platform

def get_consistent_mac_address():
    """
    Get a consistent MAC address that will be the same across all scanners.
    This ensures hardware and software data are properly linked.
    """
    mac = None
    
    # Try to get MAC from network interfaces
    try:
        for iface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if hasattr(addr, 'address'):
                    addr_str = addr.address
                    # Look for traditional MAC addresses (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
                    if (len(addr_str.split(':')) == 6 or len(addr_str.split('-')) == 6):
                        # Normalize to colon format
                        if '-' in addr_str:
                            addr_str = addr_str.replace('-', ':')
                        
                        # Validate MAC address
                        if (addr_str != "00:00:00:00:00:00" and
                            all(len(part) == 2 and part.isalnum() for part in addr_str.split(':'))):
                            mac = addr_str.upper()
                            break
            if mac:
                break
    except Exception:
        pass
    
    # Fallback: use uuid.getnode() which is consistent across the system
    if not mac:
        try:
            mac_int = uuid.getnode()
            mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff)
                            for i in range(40, -1, -8)])
            if mac == "00:00:00:00:00:00":
                mac = "Unknown"
        except Exception:
            mac = "Unknown"
    
    # Ensure consistent uppercase format
    return mac.upper() if mac != "Unknown" else mac

def get_system_identifier():
    """
    Get a unique system identifier that combines hostname and MAC address.
    This provides a more reliable way to identify systems.
    """
    hostname = platform.node()
    mac_address = get_consistent_mac_address()
    
    return {
        'hostname': hostname,
        'mac_address': mac_address,
        'system_id': f"{hostname}_{mac_address}"
    }
