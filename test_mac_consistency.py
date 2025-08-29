#!/usr/bin/env python3
"""
Test script to verify MAC address consistency across all scanners
"""

import sys
import os

# Add the scanners directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_mac_consistency():
    """Test that all scanners use the same MAC address."""
    print("=== Testing MAC Address Consistency ===\n")
    
    # Test the shared utility
    try:
        from utils import get_consistent_mac_address, get_system_identifier
        print("1. Testing shared utility:")
        mac_from_utils = get_consistent_mac_address()
        system_id = get_system_identifier()
        print(f"   MAC from utils: {mac_from_utils}")
        print(f"   System ID: {system_id}")
        print()
    except ImportError as e:
        print(f"   Error importing utils: {e}")
        return False
    
    # Test hardware scanner
    try:
        from hardware import HardwareDetector
        print("2. Testing hardware scanner:")
        hw_detector = HardwareDetector()
        hw_info = hw_detector.get_comprehensive_hardware_info()
        hw_mac = hw_info['system']['mac_address']
        print(f"   MAC from hardware scanner: {hw_mac}")
        print()
    except Exception as e:
        print(f"   Error with hardware scanner: {e}")
        return False
    
    # Test software scanner
    try:
        from software import SoftwareDetector
        print("3. Testing software scanner:")
        sw_detector = SoftwareDetector()
        sw_info = sw_detector.get_comprehensive_software_info()
        sw_mac = sw_info['system']['mac_address']
        print(f"   MAC from software scanner: {sw_mac}")
        print()
    except Exception as e:
        print(f"   Error with software scanner: {e}")
        return False
    
    # Test telemetry scanner
    try:
        from telemetry import get_mac_address
        print("4. Testing telemetry scanner:")
        telemetry_mac = get_mac_address()
        print(f"   MAC from telemetry scanner: {telemetry_mac}")
        print()
    except Exception as e:
        print(f"   Error with telemetry scanner: {e}")
        return False
    
    # Compare all MAC addresses
    print("5. Comparing MAC addresses:")
    macs = [mac_from_utils, hw_mac, sw_mac, telemetry_mac]
    unique_macs = set(macs)
    
    if len(unique_macs) == 1:
        print(f"   ✅ SUCCESS: All scanners use the same MAC address: {macs[0]}")
        return True
    else:
        print(f"   ❌ FAILURE: MAC addresses are inconsistent:")
        print(f"      Utils: {mac_from_utils}")
        print(f"      Hardware: {hw_mac}")
        print(f"      Software: {sw_mac}")
        print(f"      Telemetry: {telemetry_mac}")
        return False

if __name__ == "__main__":
    success = test_mac_consistency()
    if success:
        print("\n🎉 All tests passed! MAC addresses are consistent across all scanners.")
    else:
        print("\n💥 Tests failed! MAC addresses are inconsistent.")
        sys.exit(1)
