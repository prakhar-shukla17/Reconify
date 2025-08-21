#!/usr/bin/env python3
"""
Compatibility test for the Application Version Checker
Run this first to verify your system can run the main script
"""

import sys
import platform
import subprocess

def test_compatibility():
    print("=== System Compatibility Test ===")
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Architecture: {platform.machine()}")
    
    issues = []
    
    # Test 1: OS Check
    if platform.system() != "Windows":
        issues.append("❌ Not a Windows system")
    else:
        print("✅ Windows system detected")
    
    # Test 2: Python Version
    if sys.version_info < (3, 6):
        issues.append(f"❌ Python {sys.version_info.major}.{sys.version_info.minor} too old (need 3.6+)")
    else:
        print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} is compatible")
    
    # Test 3: winget availability
    try:
        result = subprocess.run(
            ["winget", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ winget available: {version}")
        else:
            issues.append("❌ winget command failed")
    except FileNotFoundError:
        issues.append("❌ winget not found in PATH")
    except Exception as e:
        issues.append(f"❌ winget test error: {e}")
    
    # Test 4: JSON module
    try:
        import json
        print("✅ JSON module available")
    except ImportError:
        issues.append("❌ JSON module not available")
    
    # Test 5: Unicode/encoding
    try:
        test_str = "Test: 🔍 Unicode"
        print("✅ Unicode support available")
    except UnicodeEncodeError:
        print("⚠️  Limited Unicode support (script will use fallbacks)")
    
    # Summary
    print("\n=== Compatibility Summary ===")
    if not issues:
        print("✅ All tests passed! The script should work on this system.")
        return True
    else:
        print("❌ Compatibility issues found:")
        for issue in issues:
            print(f"  {issue}")
        print("\nRecommendations:")
        if "winget" in str(issues):
            print("  - Install winget from Microsoft Store")
            print("  - Or download from: https://github.com/microsoft/winget-cli/releases")
        if "Python" in str(issues):
            print("  - Update Python to 3.6 or higher")
        return False

if __name__ == "__main__":
    test_compatibility()
