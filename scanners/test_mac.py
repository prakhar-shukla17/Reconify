#!/usr/bin/env python3
"""
Test script to debug MAC address detection
"""

import psutil
import uuid

def test_mac_detection():
    """Test MAC address detection methods."""
    print("Testing MAC address detection...")
    
    # Method 1: Using psutil
    print("\n1. Using psutil.net_if_addrs():")
    if psutil:
        for iface, addrs in psutil.net_if_addrs().items():
            print(f"  Interface: {iface}")
            for addr in addrs:
                if hasattr(addr, 'address'):
                    addr_str = addr.address
                    print(f"    Address: {addr_str} (Type: {addr.family.name if hasattr(addr, 'family') else 'Unknown'})")
                    
                    # Look specifically for IPv6 link-local addresses (fe80::)
                    if addr_str.startswith('fe80::'):
                        print(f"    ✓ IPv6 Link-Local Address: {addr_str.upper()}")
                    else:
                        print(f"    - Other address: {addr_str}")
    
    # Method 2: Using uuid.getnode
    print("\n2. Using uuid.getnode():")
    try:
        mac_int = uuid.getnode()
        mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff)
                        for i in range(40, -1, -8)])
        print(f"  MAC from uuid.getnode(): {mac}")
        if mac == "00:00:00:00:00:00":
            print("  ✗ Invalid MAC (all zeros)")
        else:
            print("  ✓ Valid MAC")
    except Exception as e:
        print(f"  ✗ Error: {e}")

if __name__ == "__main__":
    test_mac_detection()
