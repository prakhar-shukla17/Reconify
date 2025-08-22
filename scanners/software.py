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
        
        # System software (OS components, drivers, etc.)
        self.software_info['system_software'] = self._get_system_software()
        
        # Browser extensions
        self.software_info['browser_extensions'] = self._get_browser_extensions()
        
        # System services
        self.software_info['services'] = self._get_system_services()
        
        # Startup programs
        self.software_info['startup_programs'] = self._get_startup_programs()
        
        # Metadata
        self.software_info['scan_metadata'] = self._get_scan_metadata()
        
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
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        ]
        
        for key_path in registry_keys:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
                    for i in range(winreg.QueryInfoKey(key)[0]):
                        try:
                            subkey_name = winreg.EnumKey(key, i)
                            with winreg.OpenKey(key, subkey_name) as subkey:
                                software_info = {}
                                
                                # Get software details
                                try:
                                    software_info['name'] = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                except:
                                    continue  # Skip if no display name
                                
                                try:
                                    software_info['version'] = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                                except:
                                    software_info['version'] = "Unknown"
                                
                                try:
                                    software_info['vendor'] = winreg.QueryValueEx(subkey, "Publisher")[0]
                                except:
                                    software_info['vendor'] = "Unknown"
                                
                                try:
                                    install_date = winreg.QueryValueEx(subkey, "InstallDate")[0]
                                    # Convert Windows registry date format (YYYYMMDD) to readable format
                                    if install_date and len(install_date) == 8:
                                        try:
                                            year = install_date[:4]
                                            month = install_date[4:6]
                                            day = install_date[6:8]
                                            software_info['install_date'] = f"{year}-{month}-{day}"
                                        except:
                                            software_info['install_date'] = install_date
                                    else:
                                        software_info['install_date'] = install_date if install_date else "Unknown"
                                except:
                                    # Try to get install date from install location if available
                                    try:
                                        install_location = winreg.QueryValueEx(subkey, "InstallLocation")[0]
                                        if install_location and os.path.exists(install_location):
                                            # Get the creation time of the install directory
                                            creation_time = os.path.getctime(install_location)
                                            install_date = datetime.fromtimestamp(creation_time).strftime("%Y-%m-%d")
                                            software_info['install_date'] = install_date
                                        else:
                                            software_info['install_date'] = "Unknown"
                                    except:
                                        software_info['install_date'] = "Unknown"
                                
                                try:
                                    software_info['install_location'] = winreg.QueryValueEx(subkey, "InstallLocation")[0]
                                except:
                                    software_info['install_location'] = "Unknown"
                                
                                try:
                                    size = winreg.QueryValueEx(subkey, "EstimatedSize")[0]
                                    if size and size > 0:
                                        # Convert KB to MB
                                        size_mb = size / 1024
                                        software_info['size'] = f"{size_mb:.2f} MB"
                                    else:
                                        software_info['size'] = "Unknown"
                                except:
                                    software_info['size'] = "Unknown"
                                
                                software_info['registry_key'] = f"{key_path}\\{subkey_name}"
                                
                                software_list.append(software_info)
                                
                        except Exception:
                            continue
            except Exception:
                continue
        
        return software_list
    
    def _get_installed_software_linux(self):
        """Get Linux installed software."""
        software_list = []
        
        # Check package managers
        package_managers = [
            ('dpkg', 'dpkg -l', r'^ii\s+(\S+)\s+(\S+)'),
            ('rpm', 'rpm -qa', r'^(\S+)-(\S+)'),
            ('pacman', 'pacman -Q', r'^(\S+)\s+(\S+)')
        ]
        
        for pm_name, command, pattern in package_managers:
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        match = re.match(pattern, line)
                        if match:
                            if pm_name == 'dpkg':
                                name, version = match.groups()
                                # Clean up package name
                                name = name.split(':')[0]  # Remove architecture suffix
                                
                                # Get install date and size for dpkg packages
                                try:
                                    info_result = subprocess.run(['dpkg-query', '-W', '-f=${Installed-Size}\t${Status}', name], 
                                                               capture_output=True, text=True)
                                    if info_result.returncode == 0:
                                        info_parts = info_result.stdout.strip().split('\t')
                                        if len(info_parts) >= 2:
                                            size_kb = int(info_parts[0]) if info_parts[0].isdigit() else 0
                                            size_mb = size_kb / 1024
                                            size_str = f"{size_mb:.2f} MB" if size_mb > 0 else "Unknown"
                                            
                                            # Try to get install date from status
                                            status = info_parts[1]
                                            install_date = "Unknown"
                                            if "installed" in status.lower():
                                                # Get current date as fallback
                                                install_date = datetime.now().strftime("%Y-%m-%d")
                                        else:
                                            size_str = "Unknown"
                                            install_date = "Unknown"
                                    else:
                                        size_str = "Unknown"
                                        install_date = "Unknown"
                                except:
                                    size_str = "Unknown"
                                    install_date = "Unknown"
                            else:
                                name, version = match.groups()
                                size_str = "Unknown"
                                install_date = "Unknown"
                            
                            software_list.append({
                                'name': name,
                                'version': version,
                                'vendor': 'Linux Package Manager',
                                'install_date': install_date,
                                'install_location': 'System Package',
                                'size': size_str
                            })
            except Exception:
                continue
        
        return software_list
    
    def _get_installed_software_macos(self):
        """Get macOS installed software."""
        software_list = []
        
        # Check Applications folder
        app_paths = [
            '/Applications',
            os.path.expanduser('~/Applications')
        ]
        
        for app_path in app_paths:
            if os.path.exists(app_path):
                for item in os.listdir(app_path):
                    if item.endswith('.app'):
                        app_info_path = os.path.join(app_path, item, 'Contents', 'Info.plist')
                        if os.path.exists(app_info_path):
                            try:
                                result = subprocess.run(['plutil', '-convert', 'json', '-o', '-', app_info_path], 
                                                      capture_output=True, text=True)
                                if result.returncode == 0:
                                    info = json.loads(result.stdout)
                                    
                                    # Get app size
                                    app_path_full = os.path.join(app_path, item)
                                    try:
                                        size_result = subprocess.run(['du', '-sm', app_path_full], 
                                                                   capture_output=True, text=True)
                                        if size_result.returncode == 0:
                                            size_mb = size_result.stdout.strip().split('\t')[0]
                                            size_str = f"{size_mb} MB" if size_mb.isdigit() else "Unknown"
                                        else:
                                            size_str = "Unknown"
                                    except:
                                        size_str = "Unknown"
                                    
                                    software_list.append({
                                        'name': info.get('CFBundleDisplayName', info.get('CFBundleName', item)),
                                        'version': info.get('CFBundleShortVersionString', 'Unknown'),
                                        'vendor': info.get('CFBundleIdentifier', 'Unknown').split('.')[0] if info.get('CFBundleIdentifier') else 'Unknown',
                                        'install_date': 'Unknown',  # macOS doesn't store this in Info.plist
                                        'install_location': app_path_full,
                                        'size': size_str
                                    })
                            except Exception:
                                continue
        
        return software_list
    
    def _get_system_software(self):
        """Get system software (OS components, drivers, etc.)."""
        system_software = []
        
        if self.system == 'windows':
            system_software.extend(self._get_system_software_windows())
        elif self.system == 'linux':
            system_software.extend(self._get_system_software_linux())
        elif self.system == 'darwin':
            system_software.extend(self._get_system_software_macos())
        
        return system_software
    
    def _get_system_software_windows(self):
        """Get Windows system software."""
        system_software = []
        
        # Get Windows components
        try:
            cmd = '''
            Get-WmiObject -Class Win32_OperatingSystem | 
            Select-Object Caption, Version, BuildNumber, InstallDate | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                install_date = data.get('InstallDate', 'Unknown')
                # Convert WMI date format to readable format
                if install_date and install_date != 'Unknown':
                    try:
                        # WMI date format: YYYYMMDDHHMMSS.XXXXXX+XXX
                        if len(install_date) >= 8:
                            year = install_date[:4]
                            month = install_date[4:6]
                            day = install_date[6:8]
                            install_date = f"{year}-{month}-{day}"
                    except:
                        pass
                
                system_software.append({
                    'name': data.get('Caption', 'Windows Operating System'),
                    'version': data.get('Version', 'Unknown'),
                    'vendor': 'Microsoft',
                    'install_date': install_date,
                    'install_location': 'System',
                    'size': 'Unknown'
                })
        except Exception:
            pass
        
        # Get drivers
        try:
            cmd = '''
            Get-WmiObject -Class Win32_SystemDriver | 
            Select-Object Name, DisplayName, State, StartMode | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if isinstance(data, list):
                    for driver in data[:10]:  # Limit to first 10 drivers
                        system_software.append({
                            'name': driver.get('DisplayName', driver.get('Name', 'Unknown Driver')),
                            'version': 'System Driver',
                            'vendor': 'System',
                            'install_date': 'Unknown',
                            'install_location': 'System',
                            'size': 'Unknown'
                        })
        except Exception:
            pass
        
        return system_software
    
    def _get_system_software_linux(self):
        """Get Linux system software."""
        system_software = []
        
        # Get kernel info
        try:
            with open('/proc/version', 'r') as f:
                kernel_info = f.read().strip()
                system_software.append({
                    'name': 'Linux Kernel',
                    'version': kernel_info.split()[2],
                    'vendor': 'Linux',
                    'install_date': 'Unknown',
                    'install_location': 'System',
                    'size': 'Unknown'
                })
        except Exception:
            pass
        
        return system_software
    
    def _get_system_software_macos(self):
        """Get macOS system software."""
        system_software = []
        
        # Get macOS version
        try:
            result = subprocess.run(['sw_vers'], capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'ProductName:' in line:
                        name = line.split(':')[1].strip()
                    elif 'ProductVersion:' in line:
                        version = line.split(':')[1].strip()
                    elif 'BuildVersion:' in line:
                        build = line.split(':')[1].strip()
                
                system_software.append({
                    'name': name,
                    'version': f"{version} ({build})",
                    'vendor': 'Apple',
                    'install_date': 'Unknown',
                    'install_location': 'System',
                    'size': 'Unknown'
                })
        except Exception:
            pass
        
        return system_software
    
    def _get_browser_extensions(self):
        """Get browser extensions."""
        browser_extensions = []
        
        if self.system == 'windows':
            browser_extensions.extend(self._get_browser_extensions_windows())
        elif self.system == 'linux':
            browser_extensions.extend(self._get_browser_extensions_linux())
        elif self.system == 'darwin':
            browser_extensions.extend(self._get_browser_extensions_macos())
        
        return browser_extensions
    
    def _get_browser_extensions_windows(self):
        """Get Windows browser extensions."""
        extensions = []
        
        # Chrome extensions
        chrome_path = os.path.expanduser('~/AppData/Local/Google/Chrome/User Data/Default/Extensions')
        if os.path.exists(chrome_path):
            for ext_id in os.listdir(chrome_path):
                ext_dir = os.path.join(chrome_path, ext_id)
                if os.path.isdir(ext_dir):
                    for version in os.listdir(ext_dir):
                        manifest_path = os.path.join(ext_dir, version, 'manifest.json')
                        if os.path.exists(manifest_path):
                            try:
                                with open(manifest_path, 'r', encoding='utf-8') as f:
                                    manifest = json.load(f)
                                    extensions.append({
                                        'name': manifest.get('name', ext_id),
                                        'version': manifest.get('version', 'Unknown'),
                                        'browser': 'Chrome',
                                        'enabled': True
                                    })
                            except Exception:
                                continue
        
        # Firefox extensions
        firefox_path = os.path.expanduser('~/AppData/Roaming/Mozilla/Firefox/Profiles')
        if os.path.exists(firefox_path):
            for profile in os.listdir(firefox_path):
                extensions_path = os.path.join(firefox_path, profile, 'extensions')
                if os.path.exists(extensions_path):
                    for ext_file in os.listdir(extensions_path):
                        if ext_file.endswith('.xpi'):
                            extensions.append({
                                'name': ext_file.replace('.xpi', ''),
                                'version': 'Unknown',
                                'browser': 'Firefox',
                                'enabled': True
                            })
        
        return extensions
    
    def _get_browser_extensions_linux(self):
        """Get Linux browser extensions."""
        extensions = []
        
        # Chrome extensions
        chrome_path = os.path.expanduser('~/.config/google-chrome/Default/Extensions')
        if os.path.exists(chrome_path):
            for ext_id in os.listdir(chrome_path):
                ext_dir = os.path.join(chrome_path, ext_id)
                if os.path.isdir(ext_dir):
                    for version in os.listdir(ext_dir):
                        manifest_path = os.path.join(ext_dir, version, 'manifest.json')
                        if os.path.exists(manifest_path):
                            try:
                                with open(manifest_path, 'r', encoding='utf-8') as f:
                                    manifest = json.load(f)
                                    extensions.append({
                                        'name': manifest.get('name', ext_id),
                                        'version': manifest.get('version', 'Unknown'),
                                        'browser': 'Chrome',
                                        'enabled': True
                                    })
                            except Exception:
                                continue
        
        return extensions
    
    def _get_browser_extensions_macos(self):
        """Get macOS browser extensions."""
        extensions = []
        
        # Chrome extensions
        chrome_path = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Extensions')
        if os.path.exists(chrome_path):
            for ext_id in os.listdir(chrome_path):
                ext_dir = os.path.join(chrome_path, ext_id)
                if os.path.isdir(ext_dir):
                    for version in os.listdir(ext_dir):
                        manifest_path = os.path.join(ext_dir, version, 'manifest.json')
                        if os.path.exists(manifest_path):
                            try:
                                with open(manifest_path, 'r', encoding='utf-8') as f:
                                    manifest = json.load(f)
                                    extensions.append({
                                        'name': manifest.get('name', ext_id),
                                        'version': manifest.get('version', 'Unknown'),
                                        'browser': 'Chrome',
                                        'enabled': True
                                    })
                            except Exception:
                                continue
        
        return extensions
    
    def _get_system_services(self):
        """Get system services."""
        services = []
        
        if self.system == 'windows':
            services.extend(self._get_system_services_windows())
        elif self.system == 'linux':
            services.extend(self._get_system_services_linux())
        elif self.system == 'darwin':
            services.extend(self._get_system_services_macos())
        
        return services
    
    def _get_system_services_windows(self):
        """Get Windows system services."""
        services = []
        
        try:
            cmd = '''
            Get-WmiObject -Class Win32_Service | 
            Select-Object Name, DisplayName, State | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if isinstance(data, list):
                    for service in data[:20]:  # Limit to first 20 services
                        services.append({
                            'name': service.get('Name', 'Unknown'),
                            'display_name': service.get('DisplayName', 'Unknown'),
                            'state': service.get('State', 'Unknown')
                        })
        except Exception:
            pass
        
        return services
    
    def _get_system_services_linux(self):
        """Get Linux system services."""
        services = []
        
        try:
            result = subprocess.run(['systemctl', 'list-units', '--type=service', '--state=active'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n')[1:]:  # Skip header
                    if line.strip() and '.service' in line:
                        parts = line.split()
                        if len(parts) >= 4:
                            services.append({
                                'name': parts[0],
                                'display_name': parts[0],
                                'state': parts[3]
                            })
        except Exception:
            pass
        
        return services[:20]  # Limit to first 20 services
    
    def _get_system_services_macos(self):
        """Get macOS system services."""
        services = []
        
        try:
            result = subprocess.run(['launchctl', 'list'], capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n')[1:]:  # Skip header
                    if line.strip():
                        parts = line.split()
                        if len(parts) >= 3:
                            services.append({
                                'name': parts[2],
                                'display_name': parts[2],
                                'state': 'Running' if parts[0] != '-' else 'Stopped'
                            })
        except Exception:
            pass
        
        return services[:20]  # Limit to first 20 services
    
    def _get_startup_programs(self):
        """Get startup programs."""
        startup_programs = []
        
        if self.system == 'windows':
            startup_programs.extend(self._get_startup_programs_windows())
        elif self.system == 'linux':
            startup_programs.extend(self._get_startup_programs_linux())
        elif self.system == 'darwin':
            startup_programs.extend(self._get_startup_programs_macos())
        
        return startup_programs
    
    def _get_startup_programs_windows(self):
        """Get Windows startup programs."""
        startup_programs = []
        
        # Registry startup locations
        startup_keys = [
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce")
        ]
        
        for hkey, key_path in startup_keys:
            try:
                with winreg.OpenKey(hkey, key_path) as key:
                    for i in range(winreg.QueryInfoKey(key)[1]):
                        try:
                            name, command, _ = winreg.EnumValue(key, i)
                            startup_programs.append({
                                'name': name,
                                'command': command,
                                'location': key_path
                            })
                        except Exception:
                            continue
            except Exception:
                continue
        
        return startup_programs
    
    def _get_startup_programs_linux(self):
        """Get Linux startup programs."""
        startup_programs = []
        
        # Check common startup locations
        startup_locations = [
            os.path.expanduser('~/.config/autostart'),
            '/etc/xdg/autostart',
            '/etc/init.d'
        ]
        
        for location in startup_locations:
            if os.path.exists(location):
                for item in os.listdir(location):
                    item_path = os.path.join(location, item)
                    if os.path.isfile(item_path):
                        startup_programs.append({
                            'name': item,
                            'command': item_path,
                            'location': location
                        })
        
        return startup_programs
    
    def _get_startup_programs_macos(self):
        """Get macOS startup programs."""
        startup_programs = []
        
        # Check LaunchAgents and LaunchDaemons
        launch_locations = [
            os.path.expanduser('~/Library/LaunchAgents'),
            '/Library/LaunchAgents',
            '/Library/LaunchDaemons',
            '/System/Library/LaunchAgents',
            '/System/Library/LaunchDaemons'
        ]
        
        for location in launch_locations:
            if os.path.exists(location):
                for item in os.listdir(location):
                    if item.endswith('.plist'):
                        startup_programs.append({
                            'name': item.replace('.plist', ''),
                            'command': os.path.join(location, item),
                            'location': location
                        })
        
        return startup_programs
    
    def _get_scan_metadata(self):
        """Get scan metadata."""
        total_software_count = (
            len(self.software_info.get('installed_software', [])) +
            len(self.software_info.get('system_software', [])) +
            len(self.software_info.get('browser_extensions', []))
        )
        
        return {
            'total_software_count': total_software_count,
            'scan_duration': 'Unknown',  # Could be calculated with timing
            'scanner_version': '1.0',
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_mac_address(self):
        """Get MAC address."""
        # Try to use psutil/net_if_addrs for best results
        mac = None
        if PSUTIL_AVAILABLE:
            for iface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    # Only use real MACs
                    if hasattr(addr, 'address') and len(addr.address.split(':')) == 6 and addr.address != "00:00:00:00:00:00":
                        mac = addr.address
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


def main():
    """Main function - detect software and send to API."""
    import requests

    detector = SoftwareDetector()
    software_data = detector.get_comprehensive_software_info()
    
    # Use MAC address as the document ID
    mac_address = software_data['system']['mac_address']
    software_data['_id'] = mac_address
    
    try:
        response = requests.post('http://localhost:3000/api/software/', json=software_data)
        print(f"Software scan completed. Status: {response.status_code}")
        if response.status_code == 200:
            print("Software data successfully sent to API")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error sending data to API: {e}")
    
    return detector


if __name__ == "__main__":
    main()
