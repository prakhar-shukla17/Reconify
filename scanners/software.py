#!/usr/bin/env python3
"""
Software Scanner for ITAM System
Scans and collects comprehensive software information from the system
"""

import subprocess
import platform
import json
from datetime import datetime
import re
import os
import socket
import uuid
import winreg
import glob

# Tenant configuration - these will be set by the download system
TENANT_ID = os.getenv('TENANT_ID', 'default')
API_TOKEN = os.getenv('API_TOKEN', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

# Optional imports for enhanced features
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

class SoftwareDetector:
    def __init__(self):
        self.system = platform.system().lower()
        self.software_info = {}
        
    def get_comprehensive_software_info(self):
        """Get complete software information."""
        # Basic system info
        self.software_info['system'] = self._get_system_info()
        
        # Installed software information
        self.software_info['installed_software'] = self._get_installed_software()
        
        # System services
        self.software_info['services'] = self._get_system_services()
        
        # Startup programs
        self.software_info['startup_programs'] = self._get_startup_programs()
        
        # Browser extensions
        self.software_info['browser_extensions'] = self._get_browser_extensions()
        
        # System software
        self.software_info['system_software'] = self._get_system_software()
        
        # Scan metadata
        self.software_info['scan_metadata'] = self._get_scan_metadata()
        
        # Add tenant information at root level for backend compatibility
        self.software_info['tenant_id'] = TENANT_ID
        self.software_info['tenant_info'] = {
            'tenant_id': TENANT_ID,
            'scanner_version': '2.0',
            'configured_at': datetime.now().isoformat()
        }
        
        return self.software_info
    
    def _get_system_info(self):
        """Get basic system information."""
        system_info = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'mac_address': self._get_mac_address(),
            'scan_timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'python_version': platform.python_version()
        }
        
        return system_info
    
    def _get_mac_address(self):
        """Get MAC address of the primary network interface."""
        mac = None
        if PSUTIL_AVAILABLE:
            for iface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    # Only use real MACs (6 hex pairs separated by colons or hyphens)
                    if hasattr(addr, 'address'):
                        addr_str = addr.address
                        # Check if it's a valid MAC address format (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
                        if (len(addr_str.split(':')) == 6 or len(addr_str.split('-')) == 6):
                            # Normalize to colon format
                            if '-' in addr_str:
                                addr_str = addr_str.replace('-', ':')
                            
                            if (addr_str != "00:00:00:00:00:00" and
                                all(len(part) == 2 and part.isalnum() for part in addr_str.split(':'))):
                                mac = addr_str
                                break
                if mac:
                    break
        if not mac:
            # Fallback: use uuid.getnode
            mac_int = uuid.getnode()
            mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff)
                            for i in range(40, -1, -8)])
            if mac == "00:00:00:00:00:00":
                mac = "Unknown"
        
        # Ensure consistent uppercase format
        return mac.upper() if mac != "Unknown" else mac
    
    def _get_installed_software(self):
        """Get installed software information."""
        installed_software = []
        
        if self.system == 'windows':
            installed_software.extend(self._get_installed_software_windows())
        elif self.system == 'linux':
            installed_software.extend(self._get_installed_software_linux())
        elif self.system == 'darwin':
            installed_software.extend(self._get_installed_software_macos())
        
        return installed_software
    
    def _get_installed_software_windows(self):
        """Get Windows installed software from registry."""
        software_list = []
        
        # Registry keys for installed software
        registry_keys = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")
        ]
        
        for hkey, subkey in registry_keys:
            try:
                with winreg.OpenKey(hkey, subkey) as key:
                    for i in range(winreg.QueryInfoKey(key)[0]):
                        try:
                            subkey_name = winreg.EnumKey(key, i)
                            with winreg.OpenKey(key, subkey_name) as subkey_handle:
                                software_info = {}
                                
                                # Get software details
                                try:
                                    software_info['name'] = winreg.QueryValueEx(subkey_handle, "DisplayName")[0]
                                except:
                                    continue
                                
                                try:
                                    software_info['version'] = winreg.QueryValueEx(subkey_handle, "DisplayVersion")[0]
                                except:
                                    software_info['version'] = "Unknown"
                                
                                try:
                                    software_info['publisher'] = winreg.QueryValueEx(subkey_handle, "Publisher")[0]
                                except:
                                    software_info['publisher'] = "Unknown"
                                
                                try:
                                    install_date = winreg.QueryValueEx(subkey_handle, "InstallDate")[0]
                                    if install_date:
                                        # Convert YYYYMMDD format to readable date
                                        if len(install_date) == 8:
                                            year = install_date[:4]
                                            month = install_date[4:6]
                                            day = install_date[6:8]
                                            software_info['install_date'] = f"{year}-{month}-{day}"
                                        else:
                                            software_info['install_date'] = install_date
                                    else:
                                        software_info['install_date'] = "Unknown"
                                except:
                                    software_info['install_date'] = "Unknown"
                                
                                try:
                                    software_info['install_location'] = winreg.QueryValueEx(subkey_handle, "InstallLocation")[0]
                                except:
                                    software_info['install_location'] = "Unknown"
                                
                                try:
                                    software_info['uninstall_string'] = winreg.QueryValueEx(subkey_handle, "UninstallString")[0]
                                except:
                                    software_info['uninstall_string'] = "Unknown"
                                
                                # Calculate size if possible
                                software_info['size'] = self._calculate_software_size(software_info['install_location'])
                                
                                software_list.append(software_info)
                                
                        except Exception as e:
                            continue
            except Exception as e:
                continue
        
        return software_list
    
    def _get_installed_software_linux(self):
        """Get Linux installed software from package managers."""
        software_list = []
        
        # Try different package managers
        package_managers = [
            ('dpkg', ['dpkg', '-l'], self._parse_dpkg_output),
            ('rpm', ['rpm', '-qa'], self._parse_rpm_output),
            ('pacman', ['pacman', '-Q'], self._parse_pacman_output)
        ]
        
        for pm_name, cmd, parser in package_managers:
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    software_list.extend(parser(result.stdout))
                    break
            except Exception as e:
                continue
        
        return software_list
    
    def _get_installed_software_macos(self):
        """Get macOS installed software."""
        software_list = []
        
        try:
            # Get applications from /Applications
            app_dirs = ['/Applications', os.path.expanduser('~/Applications')]
            
            for app_dir in app_dirs:
                if os.path.exists(app_dir):
                    for item in os.listdir(app_dir):
                        if item.endswith('.app'):
                            app_path = os.path.join(app_dir, item)
                            app_name = item.replace('.app', '')
                            
                            software_info = {
                                'name': app_name,
                                'version': 'Unknown',
                                'publisher': 'Unknown',
                                'install_date': 'Unknown',
                                'install_location': app_path,
                                'uninstall_string': 'Unknown',
                                'size': self._calculate_software_size(app_path)
                            }
                            
                            # Try to get version from Info.plist
                            info_plist = os.path.join(app_path, 'Contents', 'Info.plist')
                            if os.path.exists(info_plist):
                                try:
                                    result = subprocess.run(['defaults', 'read', info_plist, 'CFBundleShortVersionString'], 
                                                          capture_output=True, text=True, timeout=10)
                                    if result.returncode == 0:
                                        software_info['version'] = result.stdout.strip()
                                except:
                                    pass
                            
                            software_list.append(software_info)
        except Exception as e:
            pass
        
        return software_list
    
    def _parse_dpkg_output(self, output):
        """Parse dpkg output."""
        software_list = []
        lines = output.strip().split('\n')
        
        for line in lines[5:]:  # Skip header lines
            if line.startswith('ii'):  # Installed packages
                parts = line.split()
                if len(parts) >= 3:
                    software_info = {
                        'name': parts[1],
                        'version': parts[2],
                        'publisher': 'Unknown',
                        'install_date': 'Unknown',
                        'install_location': 'Unknown',
                        'uninstall_string': 'Unknown',
                        'size': 'Unknown'
                    }
                    software_list.append(software_info)
        
        return software_list
    
    def _parse_rpm_output(self, output):
        """Parse rpm output."""
        software_list = []
        lines = output.strip().split('\n')
        
        for line in lines:
            if '-' in line:
                parts = line.rsplit('-', 2)
                if len(parts) >= 2:
                    software_info = {
                        'name': parts[0],
                        'version': parts[1] if len(parts) > 1 else 'Unknown',
                        'publisher': 'Unknown',
                        'install_date': 'Unknown',
                        'install_location': 'Unknown',
                        'uninstall_string': 'Unknown',
                        'size': 'Unknown'
                    }
                    software_list.append(software_info)
        
        return software_list
    
    def _parse_pacman_output(self, output):
        """Parse pacman output."""
        software_list = []
        lines = output.strip().split('\n')
        
        for line in lines:
            if ' ' in line:
                parts = line.split()
                if len(parts) >= 2:
                    software_info = {
                        'name': parts[0],
                        'version': parts[1],
                        'publisher': 'Unknown',
                        'install_date': 'Unknown',
                        'install_location': 'Unknown',
                        'uninstall_string': 'Unknown',
                        'size': 'Unknown'
                    }
                    software_list.append(software_info)
        
        return software_list
    
    def _calculate_software_size(self, install_path):
        """Calculate software size in MB."""
        if not install_path or install_path == "Unknown":
            return "Unknown"
        
        try:
            if os.path.exists(install_path):
                total_size = 0
                for dirpath, dirnames, filenames in os.walk(install_path):
                    for filename in filenames:
                        filepath = os.path.join(dirpath, filename)
                        try:
                            total_size += os.path.getsize(filepath)
                        except:
                            continue
                
                # Convert to MB
                size_mb = total_size / (1024 * 1024)
                return f"{size_mb:.1f} MB"
            else:
                return "Unknown"
        except:
            return "Unknown"
    
    def _get_system_services(self):
        """Get system services information."""
        services = []
        
        if self.system == 'windows':
            services.extend(self._get_windows_services())
        elif self.system == 'linux':
            services.extend(self._get_linux_services())
        
        return services
    
    def _get_windows_services(self):
        """Get Windows services."""
        services = []
        
        try:
            result = subprocess.run(['sc', 'query', 'type=', 'service', 'state=', 'all'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                current_service = {}
                
                for line in lines:
                    line = line.strip()
                    if line.startswith('SERVICE_NAME:'):
                        if current_service:
                            services.append(current_service)
                        current_service = {'name': line.split(':', 1)[1].strip()}
                    elif line.startswith('DISPLAY_NAME:'):
                        current_service['display_name'] = line.split(':', 1)[1].strip()
                    elif line.startswith('STATE:'):
                        current_service['state'] = line.split(':', 1)[1].strip()
                    elif line.startswith('START_TYPE:'):
                        current_service['start_type'] = line.split(':', 1)[1].strip()
                
                if current_service:
                    services.append(current_service)
        except Exception as e:
            pass
        
        return services
    
    def _get_linux_services(self):
        """Get Linux services."""
        services = []
        
        try:
            # Try systemctl
            result = subprocess.run(['systemctl', 'list-units', '--type=service', '--all'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if '.service' in line and not line.startswith('UNIT'):
                        parts = line.split()
                        if len(parts) >= 4:
                            service_info = {
                                'name': parts[0],
                                'display_name': parts[0],
                                'state': parts[3],
                                'start_type': 'Unknown'
                            }
                            services.append(service_info)
        except Exception as e:
            pass
        
        return services
    
    def _get_startup_programs(self):
        """Get startup programs."""
        startup_programs = []
        
        if self.system == 'windows':
            startup_programs.extend(self._get_windows_startup())
        elif self.system == 'linux':
            startup_programs.extend(self._get_linux_startup())
        
        return startup_programs
    
    def _get_windows_startup(self):
        """Get Windows startup programs."""
        startup_programs = []
        
        # Registry keys for startup programs
        startup_keys = [
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce")
        ]
        
        for hkey, subkey in startup_keys:
            try:
                with winreg.OpenKey(hkey, subkey) as key:
                    for i in range(winreg.QueryInfoKey(key)[1]):
                        try:
                            name, value, _ = winreg.EnumValue(key, i)
                            startup_info = {
                                'name': name,
                                'command': value,
                                'location': subkey
                            }
                            startup_programs.append(startup_info)
                        except:
                            continue
            except:
                continue
        
        return startup_programs
    
    def _get_linux_startup(self):
        """Get Linux startup programs."""
        startup_programs = []
        
        # Check common startup locations
        startup_locations = [
            '/etc/init.d',
            '/etc/systemd/system',
            os.path.expanduser('~/.config/autostart'),
            os.path.expanduser('~/.config/systemd/user')
        ]
        
        for location in startup_locations:
            if os.path.exists(location):
                try:
                    for item in os.listdir(location):
                        item_path = os.path.join(location, item)
                        if os.path.isfile(item_path):
                            startup_info = {
                                'name': item,
                                'command': item_path,
                                'location': location
                            }
                            startup_programs.append(startup_info)
                except:
                    continue
        
        return startup_programs
    
    def _get_browser_extensions(self):
        """Get browser extensions (placeholder)."""
        # This is a placeholder - browser extension detection would require
        # specific implementations for each browser
        return []
    
    def _get_system_software(self):
        """Get system software information."""
        system_software = []
        
        # Add operating system as system software
        system_software.append({
            'name': f"{platform.system()} {platform.release()}",
            'version': platform.version(),
            'vendor': platform.system(),
            'install_date': "Unknown",
            'install_location': "System",
            'size': "Unknown"
        })
        
        # Add Python as system software
        system_software.append({
            'name': f"Python {platform.python_version()}",
            'version': platform.python_version(),
            'vendor': "Python Software Foundation",
            'install_date': "Unknown",
            'install_location': "System",
            'size': "Unknown"
        })
        
        # Add Python implementation
        system_software.append({
            'name': f"Python Implementation: {platform.python_implementation()}",
            'version': platform.python_version(),
            'vendor': "Python Software Foundation",
            'install_date': "Unknown",
            'install_location': "System",
            'size': "Unknown"
        })
        
        if PSUTIL_AVAILABLE:
            try:
                boot_time = datetime.fromtimestamp(psutil.boot_time()).strftime("%Y-%m-%d %H:%M:%S")
                system_software.append({
                    'name': "System Boot Time",
                    'version': boot_time,
                    'vendor': "System",
                    'install_date': "Unknown",
                    'install_location': "System",
                    'size': "Unknown"
                })
            except:
                pass
        
        return system_software
    
    def _get_scan_metadata(self):
        """Get scan metadata."""
        return {
            'scan_timestamp': datetime.now().isoformat(),
            'scanner_version': '1.0',
            'scan_duration': 0,  # Would be calculated in actual implementation
            'total_software_count': len(self.software_info.get('installed_software', [])),
            'total_services_count': len(self.software_info.get('services', [])),
            'total_startup_count': len(self.software_info.get('startup_programs', []))
        }

def send_software_data(software_data, api_base_url=API_BASE_URL, api_token=API_TOKEN):
    """Send software data to the API."""
    try:
        import requests
        
        headers = {'Authorization': f'Bearer {api_token}'}
        response = requests.post(f"{api_base_url}/software", json=software_data, headers=headers, timeout=30)
        
        if response.status_code in [200, 201]:
            print(f"Software data sent successfully: {len(software_data.get('installed_software', []))} applications")
            return True
        else:
            print(f"Failed to send software data: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error sending software data: {e}")
        return False

if __name__ == "__main__":
    # Test the software detector
    detector = SoftwareDetector()
    software_info = detector.get_comprehensive_software_info()
    
    print("Software Scan Results:")
    print(f"Total installed software: {len(software_info.get('installed_software', []))}")
    print(f"Total services: {len(software_info.get('services', []))}")
    print(f"Total startup programs: {len(software_info.get('startup_programs', []))}")
    
    # Send to API
    send_software_data(software_info)
