#!/usr/bin/env python3
"""
Software Detection and Inventory Script
Detects installed software on Windows, macOS, and Linux systems
Sends data to ITAM server via POST request
"""

import os
import sys
import platform
import subprocess
import json
import requests
import re
from datetime import datetime
import socket
import uuid

# Try to import optional libraries
try:
    import winreg
    WINREG_AVAILABLE = True
except ImportError:
    WINREG_AVAILABLE = False

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    print("Warning: psutil not available. Some features may be limited.")

class SoftwareDetector:
    def __init__(self):
        self.system = platform.system().lower()
        self.software_info = {
            'system': {},
            'installed_software': [],
            'system_software': [],
            'browser_extensions': [],
            'services': [],
            'startup_programs': []
        }
        
    def get_mac_address(self):
        """Get the MAC address of the primary network interface"""
        try:
            # Try to use psutil for best results (same method as hardware.py)
            mac = None
            if PSUTIL_AVAILABLE:
                import psutil
                for iface, addrs in psutil.net_if_addrs().items():
                    for addr in addrs:
                        # Only use real MACs (same logic as hardware.py)
                        if (hasattr(addr, 'address') and 
                            len(addr.address.split(':')) == 6 and 
                            addr.address != "00:00:00:00:00:00"):
                            mac = addr.address
                            break
                    if mac:
                        break
            
            # Fallback: use uuid.getnode (same as hardware.py)
            if not mac:
                mac_int = uuid.getnode()
                mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff)
                               for i in range(40, -1, -8)])
                if mac == "00:00:00:00:00:00":
                    mac = "Unknown"
            
            return mac.upper() if mac != "Unknown" else mac
        except Exception as e:
            print(f"Error getting MAC address: {e}")
            return "Unknown"
    
    def get_system_info(self):
        """Get basic system information"""
        try:
            hostname = socket.gethostname()
            mac_address = self.get_mac_address()
            
            self.software_info['system'] = {
                'platform': platform.system(),
                'platform_release': platform.release(),
                'platform_version': platform.version(),
                'architecture': platform.machine(),
                'hostname': hostname,
                'mac_address': mac_address,
                'scan_timestamp': datetime.now().isoformat(),
                'python_version': platform.python_version()
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
    
    def get_installed_software_windows(self):
        """Get installed software on Windows using registry"""
        if not WINREG_AVAILABLE:
            print("Windows registry access not available")
            return []
        
        software_list = []
        registry_paths = [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        ]
        
        for registry_path in registry_paths:
            try:
                registry_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, registry_path)
                for i in range(0, winreg.QueryInfoKey(registry_key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(registry_key, i)
                        subkey = winreg.OpenKey(registry_key, subkey_name)
                        
                        software_info = {}
                        try:
                            software_info['name'] = winreg.QueryValueEx(subkey, "DisplayName")[0]
                        except FileNotFoundError:
                            continue  # Skip entries without DisplayName
                        
                        try:
                            software_info['version'] = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                        except FileNotFoundError:
                            software_info['version'] = "Unknown"
                        
                        try:
                            software_info['vendor'] = winreg.QueryValueEx(subkey, "Publisher")[0]
                        except FileNotFoundError:
                            software_info['vendor'] = "Unknown"
                        
                        try:
                            install_date = winreg.QueryValueEx(subkey, "InstallDate")[0]
                            if install_date and len(install_date) == 8:
                                # Format: YYYYMMDD
                                formatted_date = f"{install_date[:4]}-{install_date[4:6]}-{install_date[6:8]}"
                                software_info['install_date'] = formatted_date
                            else:
                                software_info['install_date'] = "Unknown"
                        except FileNotFoundError:
                            software_info['install_date'] = "Unknown"
                        
                        try:
                            software_info['install_location'] = winreg.QueryValueEx(subkey, "InstallLocation")[0]
                        except FileNotFoundError:
                            software_info['install_location'] = "Unknown"
                        
                        try:
                            size_kb = winreg.QueryValueEx(subkey, "EstimatedSize")[0]
                            software_info['size'] = f"{size_kb / 1024:.2f} MB" if size_kb else "Unknown"
                        except (FileNotFoundError, TypeError):
                            software_info['size'] = "Unknown"
                        
                        software_info['registry_key'] = subkey_name
                        software_list.append(software_info)
                        
                        winreg.CloseKey(subkey)
                    except Exception as e:
                        continue
                
                winreg.CloseKey(registry_key)
            except Exception as e:
                print(f"Error accessing registry path {registry_path}: {e}")
        
        return software_list
    
    def get_installed_software_macos(self):
        """Get installed software on macOS"""
        software_list = []
        
        # Get applications from /Applications
        try:
            apps_dir = "/Applications"
            if os.path.exists(apps_dir):
                for item in os.listdir(apps_dir):
                    if item.endswith('.app'):
                        app_path = os.path.join(apps_dir, item)
                        software_info = {
                            'name': item.replace('.app', ''),
                            'version': self._get_macos_app_version(app_path),
                            'vendor': self._get_macos_app_vendor(app_path),
                            'install_date': self._get_file_creation_date(app_path),
                            'install_location': app_path,
                            'size': self._get_directory_size(app_path)
                        }
                        software_list.append(software_info)
        except Exception as e:
            print(f"Error getting macOS applications: {e}")
        
        # Get Homebrew packages
        try:
            result = subprocess.run(['brew', 'list', '--versions'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            name = parts[0]
                            version = ' '.join(parts[1:])
                            software_info = {
                                'name': name,
                                'version': version,
                                'vendor': 'Homebrew',
                                'install_date': "Unknown",
                                'install_location': f"/usr/local/Cellar/{name}",
                                'size': "Unknown"
                            }
                            software_list.append(software_info)
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
            pass  # Homebrew not available
        
        return software_list
    
    def get_installed_software_linux(self):
        """Get installed software on Linux"""
        software_list = []
        
        # Try different package managers
        package_managers = [
            ('dpkg', ['dpkg', '-l']),
            ('rpm', ['rpm', '-qa']),
            ('pacman', ['pacman', '-Q']),
            ('zypper', ['zypper', 'search', '--installed-only']),
            ('dnf', ['dnf', 'list', 'installed']),
            ('yum', ['yum', 'list', 'installed'])
        ]
        
        for pm_name, command in package_managers:
            try:
                result = subprocess.run(command, capture_output=True, text=True, timeout=60)
                if result.returncode == 0:
                    software_list.extend(self._parse_package_manager_output(pm_name, result.stdout))
                    break  # Use the first successful package manager
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
                continue
        
        # Get snap packages
        try:
            result = subprocess.run(['snap', 'list'], capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n')[1:]:  # Skip header
                    parts = line.split()
                    if len(parts) >= 3:
                        software_info = {
                            'name': parts[0],
                            'version': parts[1],
                            'vendor': 'Snap Store',
                            'install_date': "Unknown",
                            'install_location': f"/snap/{parts[0]}",
                            'size': "Unknown"
                        }
                        software_list.append(software_info)
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
            pass
        
        # Get flatpak packages
        try:
            result = subprocess.run(['flatpak', 'list'], capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        software_info = {
                            'name': parts[0],
                            'version': parts[1] if len(parts) > 1 else "Unknown",
                            'vendor': 'Flatpak',
                            'install_date': "Unknown",
                            'install_location': "Flatpak sandbox",
                            'size': "Unknown"
                        }
                        software_list.append(software_info)
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
            pass
        
        return software_list
    
    def _parse_package_manager_output(self, pm_name, output):
        """Parse output from different package managers"""
        software_list = []
        
        if pm_name == 'dpkg':
            for line in output.strip().split('\n'):
                if line.startswith('ii'):  # Installed packages
                    parts = line.split()
                    if len(parts) >= 3:
                        software_info = {
                            'name': parts[1],
                            'version': parts[2],
                            'vendor': 'Debian Package',
                            'install_date': "Unknown",
                            'install_location': "System package",
                            'size': "Unknown"
                        }
                        software_list.append(software_info)
        
        elif pm_name == 'rpm':
            for line in output.strip().split('\n'):
                if line.strip():
                    # Parse RPM package name format: name-version-release.arch
                    match = re.match(r'^(.+)-([^-]+)-([^-]+)\.(.+)$', line.strip())
                    if match:
                        software_info = {
                            'name': match.group(1),
                            'version': f"{match.group(2)}-{match.group(3)}",
                            'vendor': 'RPM Package',
                            'install_date': "Unknown",
                            'install_location': "System package",
                            'size': "Unknown"
                        }
                        software_list.append(software_info)
        
        elif pm_name == 'pacman':
            for line in output.strip().split('\n'):
                parts = line.split()
                if len(parts) >= 2:
                    software_info = {
                        'name': parts[0],
                        'version': parts[1],
                        'vendor': 'Arch Package',
                        'install_date': "Unknown",
                        'install_location': "System package",
                        'size': "Unknown"
                    }
                    software_list.append(software_info)
        
        return software_list
    
    def get_system_services(self):
        """Get system services information"""
        services = []
        
        if self.system == 'windows':
            try:
                result = subprocess.run(['sc', 'query'], capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    # Parse Windows services
                    current_service = {}
                    for line in result.stdout.split('\n'):
                        line = line.strip()
                        if line.startswith('SERVICE_NAME:'):
                            if current_service:
                                services.append(current_service)
                            current_service = {'name': line.split(':', 1)[1].strip()}
                        elif line.startswith('DISPLAY_NAME:'):
                            current_service['display_name'] = line.split(':', 1)[1].strip()
                        elif line.startswith('STATE:'):
                            current_service['state'] = line.split(':', 1)[1].strip()
                    
                    if current_service:
                        services.append(current_service)
            except Exception as e:
                print(f"Error getting Windows services: {e}")
        
        elif self.system == 'linux':
            try:
                # Try systemctl first
                result = subprocess.run(['systemctl', 'list-units', '--type=service'], 
                                      capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    for line in result.stdout.split('\n')[1:]:  # Skip header
                        parts = line.split()
                        if len(parts) >= 4:
                            services.append({
                                'name': parts[0],
                                'state': parts[2],
                                'display_name': ' '.join(parts[4:]) if len(parts) > 4 else parts[0]
                            })
            except Exception as e:
                print(f"Error getting Linux services: {e}")
        
        return services[:50]  # Limit to first 50 services
    
    def get_startup_programs(self):
        """Get startup programs"""
        startup_programs = []
        
        if self.system == 'windows':
            try:
                # Get from registry
                startup_locations = [
                    r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                    r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
                ]
                
                for location in startup_locations:
                    try:
                        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, location)
                        for i in range(winreg.QueryInfoKey(key)[1]):
                            try:
                                name, value, _ = winreg.EnumValue(key, i)
                                startup_programs.append({
                                    'name': name,
                                    'command': value,
                                    'location': 'HKLM\\' + location
                                })
                            except Exception:
                                continue
                        winreg.CloseKey(key)
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error getting Windows startup programs: {e}")
        
        elif self.system == 'linux':
            # Check common autostart directories
            autostart_dirs = [
                '/etc/xdg/autostart',
                os.path.expanduser('~/.config/autostart'),
                '/usr/share/autostart'
            ]
            
            for autostart_dir in autostart_dirs:
                if os.path.exists(autostart_dir):
                    try:
                        for file in os.listdir(autostart_dir):
                            if file.endswith('.desktop'):
                                startup_programs.append({
                                    'name': file.replace('.desktop', ''),
                                    'command': f"Desktop entry: {file}",
                                    'location': autostart_dir
                                })
                    except Exception:
                        continue
        
        return startup_programs
    
    def _get_macos_app_version(self, app_path):
        """Get macOS application version"""
        try:
            plist_path = os.path.join(app_path, 'Contents', 'Info.plist')
            if os.path.exists(plist_path):
                result = subprocess.run(['plutil', '-p', plist_path], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if 'CFBundleShortVersionString' in line:
                            return line.split('=>')[1].strip().strip('"')
        except Exception:
            pass
        return "Unknown"
    
    def _get_macos_app_vendor(self, app_path):
        """Get macOS application vendor"""
        try:
            plist_path = os.path.join(app_path, 'Contents', 'Info.plist')
            if os.path.exists(plist_path):
                result = subprocess.run(['plutil', '-p', plist_path], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if 'CFBundleIdentifier' in line:
                            identifier = line.split('=>')[1].strip().strip('"')
                            # Extract vendor from reverse domain notation
                            parts = identifier.split('.')
                            if len(parts) >= 2:
                                return parts[1].capitalize()
        except Exception:
            pass
        return "Unknown"
    
    def _get_file_creation_date(self, file_path):
        """Get file creation date"""
        try:
            stat = os.stat(file_path)
            return datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d')
        except Exception:
            return "Unknown"
    
    def _get_directory_size(self, directory):
        """Get directory size"""
        try:
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(directory):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    try:
                        total_size += os.path.getsize(filepath)
                    except (OSError, IOError):
                        continue
            return f"{total_size / (1024*1024):.2f} MB"
        except Exception:
            return "Unknown"
    
    def get_comprehensive_software_info(self):
        """Get comprehensive software information"""
        print("Starting software detection...")
        
        # Get system information
        self.get_system_info()
        print("✓ System information collected")
        
        # Get installed software based on OS
        if self.system == 'windows':
            self.software_info['installed_software'] = self.get_installed_software_windows()
        elif self.system == 'darwin':
            self.software_info['installed_software'] = self.get_installed_software_macos()
        elif self.system == 'linux':
            self.software_info['installed_software'] = self.get_installed_software_linux()
        
        print(f"✓ Found {len(self.software_info['installed_software'])} installed software packages")
        
        # Get system services
        self.software_info['services'] = self.get_system_services()
        print(f"✓ Found {len(self.software_info['services'])} system services")
        
        # Get startup programs
        self.software_info['startup_programs'] = self.get_startup_programs()
        print(f"✓ Found {len(self.software_info['startup_programs'])} startup programs")
        
        return self.software_info
    
    def send_to_server(self, software_data, server_url="http://localhost:3000/api/software"):
        """Send software data to the ITAM server"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'ITAM-Software-Scanner/1.0'
            }
            
            print(f"Sending software data to {server_url}...")
            response = requests.post(server_url, json=software_data, headers=headers, timeout=30)
            
            if response.status_code == 200 or response.status_code == 201:
                print("✓ Software data sent successfully!")
                print(f"Response: {response.json()}")
                return True
            else:
                print(f"✗ Failed to send data. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Error sending data to server: {e}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            return False

def main():
    """Main function"""
    print("ITAM Software Detection Scanner")
    print("=" * 40)
    
    # Initialize detector
    detector = SoftwareDetector()
    
    # Get comprehensive software information
    try:
        software_data = detector.get_comprehensive_software_info()
        
        # Print summary
        print("\nSoftware Detection Summary:")
        print("-" * 30)
        print(f"System: {software_data['system']['platform']} {software_data['system']['platform_release']}")
        print(f"Hostname: {software_data['system']['hostname']}")
        print(f"MAC Address: {software_data['system']['mac_address']}")
        print(f"Installed Software: {len(software_data['installed_software'])} packages")
        print(f"System Services: {len(software_data['services'])} services")
        print(f"Startup Programs: {len(software_data['startup_programs'])} programs")
        
        # Save to JSON file for debugging
        # with open('software_data.json', 'w') as f:
        #     json.dump(software_data, f, indent=2)
        # print(f"\n✓ Software data saved to software_data.json")
        
        # Send to server
        success = detector.send_to_server(software_data)
        
        if success:
            print("\n✓ Software inventory completed successfully!")
        else:
            print("\n✗ Software inventory completed but failed to send to server")
            print("Check if the ITAM server is running on http://localhost:3000")
        
    except KeyboardInterrupt:
        print("\n\nScan interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error during software detection: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
