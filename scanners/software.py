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
            'scan_timestamp': datetime.now().isoformat(),
            'python_version': platform.python_version()
        }
        return system_info
    
    def _get_mac_address(self):
        """Get MAC address of the primary network interface."""
        mac = None
        if PSUTIL_AVAILABLE:
            for iface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if hasattr(addr, 'address'):
                        mac_addr = addr.address
                        if len(mac_addr.split(':')) == 6 and mac_addr != "00:00:00:00:00:00":
                            mac = mac_addr
                            break
                if mac:
                    break
        if not mac:
            mac_int = uuid.getnode()
            mac = ':'.join(['{:02x}'.format((mac_int >> i) & 0xff) for i in range(40, -1, -8)])
            if mac == "00:00:00:00:00:00":
                mac = "Unknown"
        return mac.upper()
    
    def _get_installed_software(self):
        """Get installed software information based on platform."""
        if self.system == "windows":
            return self._get_windows_software()
        elif self.system == "linux":
            return self._get_linux_software()
        elif self.system == "darwin":
            return self._get_macos_software()
        else:
            return []
    
    def _get_windows_software(self):
        """Get installed software from Windows Registry."""
        software_list = []
        try:
            # Query 64-bit software
            cmd_64 = ['reg', 'query', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '/s']
            result_64 = subprocess.run(cmd_64, capture_output=True, text=True, timeout=30)
            
            # Query 32-bit software
            cmd_32 = ['reg', 'query', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '/s']
            result_32 = subprocess.run(cmd_32, capture_output=True, text=True, timeout=30)
            
            # Parse 64-bit results
            if result_64.returncode == 0:
                software_list.extend(self._parse_windows_registry(result_64.stdout))
            
            # Parse 32-bit results
            if result_32.returncode == 0:
                software_list.extend(self._parse_windows_registry(result_32.stdout))
                
        except Exception as e:
            print(f"Error getting Windows software: {e}")
        
        return software_list
    
    def _parse_windows_registry(self, registry_output):
        """Parse Windows registry output for software information."""
        software_list = []
        current_software = {}
        
        for line in registry_output.split('\n'):
            line = line.strip()
            if line.startswith('HKEY_'):
                if current_software and current_software.get('name'):
                    software_list.append(current_software)
                current_software = {}
            elif 'DisplayName' in line and 'REG_SZ' in line:
                name = line.split('REG_SZ')[-1].strip()
                if name and name != '(value not set)':
                    current_software['name'] = name
            elif 'DisplayVersion' in line and 'REG_SZ' in line:
                version = line.split('REG_SZ')[-1].strip()
                if version and version != '(value not set)':
                    current_software['version'] = version
            elif 'Publisher' in line and 'REG_SZ' in line:
                vendor = line.split('REG_SZ')[-1].strip()
                if vendor and vendor != '(value not set)':
                    current_software['vendor'] = vendor
            elif 'InstallDate' in line and 'REG_SZ' in line:
                install_date = line.split('REG_SZ')[-1].strip()
                if install_date and install_date != '(value not set)':
                    # Convert YYYYMMDD to YYYY-MM-DD
                    if len(install_date) == 8:
                        install_date = f"{install_date[:4]}-{install_date[4:6]}-{install_date[6:]}"
                    current_software['install_date'] = install_date
            elif 'EstimatedSize' in line and 'REG_DWORD' in line:
                size_str = line.split('REG_DWORD')[-1].strip()
                if size_str and size_str != '(value not set)':
                    try:
                        size_kb = int(size_str, 16) if '0x' in size_str else int(size_str)
                        size_mb = size_kb / 1024
                        current_software['size'] = f"{size_mb:.1f} MB"
                    except:
                        current_software['size'] = "Unknown"
        
        # Add the last software if it has a name
        if current_software and current_software.get('name'):
            software_list.append(current_software)
        
        return software_list
    
    def _get_linux_software(self):
        """Get installed software from Linux package managers."""
        software_list = []
        
        # Try different package managers
        package_managers = [
            ('dpkg', ['dpkg', '-l']),
            ('rpm', ['rpm', '-qa']),
            ('pacman', ['pacman', '-Q']),
        ]
        
        for pm_name, cmd in package_managers:
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    software_list.extend(self._parse_linux_packages(result.stdout, pm_name))
                    break
            except Exception as e:
                print(f"Error with {pm_name}: {e}")
                continue
        
        return software_list
    
    def _parse_linux_packages(self, output, package_manager):
        """Parse Linux package manager output."""
        software_list = []
        
        if package_manager == 'dpkg':
            for line in output.split('\n'):
                if line.startswith('ii '):
                    parts = line.split()
                    if len(parts) >= 3:
                        name = parts[1]
                        version = parts[2]
                        software_list.append({
                            'name': name,
                            'version': version,
                            'vendor': 'Debian/Ubuntu',
                            'install_date': 'Unknown',
                            'size': 'Unknown'
                        })
        
        elif package_manager == 'rpm':
            for line in output.split('\n'):
                if line:
                    # RPM format: name-version-release.arch
                    parts = line.rsplit('-', 2)
                    if len(parts) >= 2:
                        name = parts[0]
                        version = parts[1]
                        software_list.append({
                            'name': name,
                            'version': version,
                            'vendor': 'RPM',
                            'install_date': 'Unknown',
                            'size': 'Unknown'
                        })
        
        elif package_manager == 'pacman':
            for line in output.split('\n'):
                if line:
                    parts = line.split()
                    if len(parts) >= 2:
                        name = parts[0]
                        version = parts[1]
                        software_list.append({
                            'name': name,
                            'version': version,
                            'vendor': 'Arch',
                            'install_date': 'Unknown',
                            'size': 'Unknown'
                        })
        
        return software_list
    
    def _get_macos_software(self):
        """Get installed software from macOS."""
        software_list = []
        
        try:
            # Get applications from /Applications
            app_path = '/Applications'
            if os.path.exists(app_path):
                for item in os.listdir(app_path):
                    if item.endswith('.app'):
                        app_name = item.replace('.app', '')
                        software_list.append({
                            'name': app_name,
                            'version': 'Unknown',
                            'vendor': 'macOS',
                            'install_date': 'Unknown',
                            'size': 'Unknown'
                        })
            
            # Get system software using system_profiler
            cmd = ['system_profiler', 'SPApplicationsDataType']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                software_list.extend(self._parse_macos_system_profiler(result.stdout))
                
        except Exception as e:
            print(f"Error getting macOS software: {e}")
        
        return software_list
    
    def _parse_macos_system_profiler(self, output):
        """Parse macOS system_profiler output."""
        software_list = []
        current_app = {}
        
        for line in output.split('\n'):
            line = line.strip()
            if line.startswith('Name:'):
                if current_app and current_app.get('name'):
                    software_list.append(current_app)
                current_app = {'name': line.split(':', 1)[1].strip()}
            elif line.startswith('Version:'):
                version = line.split(':', 1)[1].strip()
                current_app['version'] = version
            elif line.startswith('Location:'):
                location = line.split(':', 1)[1].strip()
                current_app['install_location'] = location
        
        # Add the last app
        if current_app and current_app.get('name'):
            software_list.append(current_app)
        
        return software_list
    
    def _get_system_services(self):
        """Get system services information."""
        services = []
        
        if self.system == "windows":
            try:
                cmd = ['sc', 'query', 'type=', 'service', 'state=', 'all']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    services = self._parse_windows_services(result.stdout)
            except Exception as e:
                print(f"Error getting Windows services: {e}")
        
        elif self.system == "linux":
            try:
                # Try systemctl first
                cmd = ['systemctl', 'list-units', '--type=service', '--all']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    services = self._parse_linux_services(result.stdout)
            except Exception as e:
                print(f"Error getting Linux services: {e}")
        
        return services
    
    def _parse_windows_services(self, output):
        """Parse Windows services output."""
        services = []
        current_service = {}
        
        for line in output.split('\n'):
            line = line.strip()
            if line.startswith('SERVICE_NAME:'):
                if current_service and current_service.get('name'):
                    services.append(current_service)
                current_service = {'name': line.split(':', 1)[1].strip()}
            elif line.startswith('DISPLAY_NAME:'):
                display_name = line.split(':', 1)[1].strip()
                current_service['display_name'] = display_name
            elif line.startswith('STATE:'):
                state = line.split(':', 1)[1].strip()
                current_service['state'] = state
        
        # Add the last service
        if current_service and current_service.get('name'):
            services.append(current_service)
        
        return services
    
    def _parse_linux_services(self, output):
        """Parse Linux services output."""
        services = []
        
        for line in output.split('\n'):
            if '.service' in line:
                parts = line.split()
                if len(parts) >= 4:
                    name = parts[0]
                    state = parts[3]
                    services.append({
                        'name': name,
                        'display_name': name,
                        'state': state
                    })
        
        return services
    
    def _get_startup_programs(self):
        """Get startup programs information."""
        startup_programs = []
        
        if self.system == "windows":
            try:
                # Get startup programs from registry
                cmd = ['reg', 'query', 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', '*']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    startup_programs = self._parse_windows_startup(result.stdout)
            except Exception as e:
                print(f"Error getting Windows startup programs: {e}")
        
        elif self.system == "linux":
            try:
                # Check common startup locations
                startup_locations = [
                    '/etc/init.d/',
                    '/etc/systemd/system/',
                    '~/.config/autostart/'
                ]
                
                for location in startup_locations:
                    expanded_path = os.path.expanduser(location)
                    if os.path.exists(expanded_path):
                        for item in os.listdir(expanded_path):
                            startup_programs.append({
                                'name': item,
                                'command': 'Unknown',
                                'location': expanded_path
                            })
            except Exception as e:
                print(f"Error getting Linux startup programs: {e}")
        
        return startup_programs
    
    def _parse_windows_startup(self, output):
        """Parse Windows startup programs output."""
        startup_programs = []
        
        for line in output.split('\n'):
            if 'REG_SZ' in line:
                parts = line.split('REG_SZ')
                if len(parts) >= 2:
                    name = parts[0].strip()
                    command = parts[1].strip()
                    startup_programs.append({
                        'name': name,
                        'command': command,
                        'location': 'Registry'
                    })
        
        return startup_programs
    
    def _get_browser_extensions(self):
        """Get browser extensions information."""
        extensions = []
        
        # This is a simplified version - in a real implementation,
        # you would need to parse browser-specific extension directories
        # For now, return an empty list
        return extensions
    
    def _get_system_software(self):
        """Get system software information."""
        system_software = []
        
        # Add OS information
        system_software.append({
            'name': f"{platform.system()} {platform.release()}",
            'version': platform.version(),
            'vendor': platform.system(),
            'install_date': 'Unknown',
            'size': 'Unknown'
        })
        
        return system_software
    
    def _get_scan_metadata(self):
        """Get scan metadata information."""
        total_count = (
            len(self.software_info.get('installed_software', [])) +
            len(self.software_info.get('system_software', [])) +
            len(self.software_info.get('browser_extensions', []))
        )
        
        return {
            'total_software_count': total_count,
            'scan_duration': 'Unknown',
            'scanner_version': '1.0',
            'last_updated': datetime.now().isoformat()
        }

def send_software_data(api_url):
    """Send software data to the API."""
    detector = SoftwareDetector()
    software_data = detector.get_comprehensive_software_info()
    
    try:
        import requests
        response = requests.post(api_url, json=software_data, timeout=30)
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text,
            "data": software_data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Example usage: replace URL with your API endpoint
    result = send_software_data("http://localhost:3000/api/software")
    print("Software Scan Result:", result)