import subprocess
import platform
import json
from datetime import datetime
import re
import os
import socket


# Optional imports for enhanced features
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False


try:
    import GPUtil
    GPUTIL_AVAILABLE = True
except ImportError:
    GPUTIL_AVAILABLE = False


class HardwareDetector:
    def __init__(self):
        self.system = platform.system().lower()
        self.hardware_info = {}
        
    def get_comprehensive_hardware_info(self):
        """Get complete hardware information."""
        # Basic system info
        self.hardware_info['system'] = self._get_system_info()
        
        # CPU information
        self.hardware_info['cpu'] = self._get_cpu_info()
        
        # Memory information
        self.hardware_info['memory'] = self._get_memory_info()
        
        # Storage information
        self.hardware_info['storage'] = self._get_storage_info()
        
        # Network hardware
        self.hardware_info['network'] = self._get_network_hardware()
        
        # Graphics information
        self.hardware_info['graphics'] = self._get_graphics_info()
        
        # Motherboard and BIOS
        self.hardware_info['motherboard'] = self._get_motherboard_info()
        
        # Power and thermal
        self.hardware_info['power_thermal'] = self._get_power_thermal_info()
        
        # Auto-export hardware info
        # self.export_hardware_info()
        
        return self.hardware_info
    
    def _get_system_info(self):
        """Get basic system information."""
        system_info = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'boot_time': None,
            'uptime': None,
            'mac_address': self._get_mac_address()
        }
        
        if PSUTIL_AVAILABLE:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            system_info['boot_time'] = boot_time.strftime("%Y-%m-%d %H:%M:%S")
            system_info['uptime'] = str(datetime.now() - boot_time)
        
        return system_info
    
    def _get_cpu_info(self):
        """Get detailed CPU information."""
        cpu_info = {
            'name': platform.processor(),
            'physical_cores': None,
            'logical_cores': None,
            'max_frequency': None,
            'min_frequency': None,
            'current_frequency': None,
            'architecture': platform.machine(),
            'cache_info': {},
            'features': []
        }
        
        if PSUTIL_AVAILABLE:
            cpu_info['physical_cores'] = psutil.cpu_count(logical=False)
            cpu_info['logical_cores'] = psutil.cpu_count(logical=True)
            
            try:
                cpu_freq = psutil.cpu_freq()
                if cpu_freq:
                    cpu_info['max_frequency'] = f"{cpu_freq.max:.2f} MHz"
                    cpu_info['min_frequency'] = f"{cpu_freq.min:.2f} MHz"
                    cpu_info['current_frequency'] = f"{cpu_freq.current:.2f} MHz"
            except:
                pass
        
        # Platform-specific CPU details
        if self.system == 'windows':
            cpu_info.update(self._get_cpu_info_windows())
        elif self.system == 'linux':
            cpu_info.update(self._get_cpu_info_linux())
        elif self.system == 'darwin':
            cpu_info.update(self._get_cpu_info_macos())
        
        return cpu_info
    
    def _get_cpu_info_windows(self):
        """Get Windows-specific CPU information."""
        cpu_details = {}
        try:
            cmd = '''
            Get-WmiObject -Class Win32_Processor | 
            Select-Object Name, Manufacturer, Family, Model, Stepping, MaxClockSpeed, 
            L2CacheSize, L3CacheSize, NumberOfCores, NumberOfLogicalProcessors | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if isinstance(data, list):
                    data = data[0]
                
                cpu_details = {
                    'name': data.get('Name', '').strip(),
                    'manufacturer': data.get('Manufacturer', ''),
                    'family': data.get('Family'),
                    'model': data.get('Model'),
                    'stepping': data.get('Stepping'),
                    'max_clock_speed': f"{data.get('MaxClockSpeed', 0)} MHz",
                    'l2_cache': f"{data.get('L2CacheSize', 0)} KB",
                    'l3_cache': f"{data.get('L3CacheSize', 0)} KB"
                }
        except Exception:
            pass
        
        return cpu_details
    
    def _get_cpu_info_linux(self):
        """Get Linux-specific CPU information."""
        cpu_details = {}
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
                
                for line in cpuinfo.split('\n'):
                    if 'model name' in line:
                        cpu_details['name'] = line.split(':')[1].strip()
                    elif 'vendor_id' in line:
                        cpu_details['vendor'] = line.split(':')[1].strip()
                    elif 'cpu family' in line:
                        cpu_details['family'] = line.split(':')[1].strip()
                    elif 'model' in line and 'name' not in line:
                        cpu_details['model'] = line.split(':')[1].strip()
                    elif 'stepping' in line:
                        cpu_details['stepping'] = line.split(':')[1].strip()
                    elif 'cache size' in line:
                        cpu_details['cache_size'] = line.split(':')[1].strip()
                    elif 'flags' in line:
                        cpu_details['features'] = line.split(':')[1].strip().split()
        except Exception:
            pass
        
        return cpu_details
    
    def _get_cpu_info_macos(self):
        """Get macOS-specific CPU information."""
        cpu_details = {}
        try:
            result = subprocess.run(['sysctl', '-n', 'machdep.cpu.brand_string'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                cpu_details['name'] = result.stdout.strip()
            
            cpu_commands = {
                'vendor': 'machdep.cpu.vendor',
                'family': 'machdep.cpu.family',
                'model': 'machdep.cpu.model',
                'stepping': 'machdep.cpu.stepping',
                'cache_size': 'hw.l3cachesize'
            }
            
            for key, command in cpu_commands.items():
                try:
                    result = subprocess.run(['sysctl', '-n', command], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        cpu_details[key] = result.stdout.strip()
                except:
                    pass
        except Exception:
            pass
        
        return cpu_details
    
    def _get_memory_info(self):
        """Get detailed memory information."""
        memory_info = {
            'total': None,
            'available': None,
            'used': None,
            'percentage': None,
            'slots': [],
            'type': None,
            'speed': None
        }
        
        if PSUTIL_AVAILABLE:
            mem = psutil.virtual_memory()
            memory_info.update({
                'total': f"{mem.total / (1024**3):.2f} GB",
                'available': f"{mem.available / (1024**3):.2f} GB",
                'used': f"{mem.used / (1024**3):.2f} GB",
                'percentage': f"{mem.percent}%"
            })
        
        if self.system == 'windows':
            memory_info.update(self._get_memory_info_windows())
        elif self.system == 'linux':
            memory_info.update(self._get_memory_info_linux())
        elif self.system == 'darwin':
            memory_info.update(self._get_memory_info_macos())
        
        return memory_info
    
    def _get_memory_info_windows(self):
        """Get Windows-specific memory information."""
        memory_details = {}
        try:
            cmd = '''
            Get-WmiObject -Class Win32_PhysicalMemory | 
            Select-Object Capacity, Speed, MemoryType, FormFactor, Manufacturer | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if not isinstance(data, list):
                    data = [data]
                
                slots = []
                total_capacity = 0
                for slot in data:
                    capacity_gb = int(slot.get('Capacity', 0)) / (1024**3)
                    total_capacity += capacity_gb
                    
                    slots.append({
                        'capacity': f"{capacity_gb:.0f} GB",
                        'speed': f"{slot.get('Speed', 0)} MHz",
                        'type': slot.get('MemoryType', 'Unknown'),
                        'form_factor': slot.get('FormFactor', 'Unknown'),
                        'manufacturer': slot.get('Manufacturer', 'Unknown')
                    })
                
                memory_details = {
                    'slots': slots,
                    'total_physical': f"{total_capacity:.0f} GB",
                    'slot_count': len(slots)
                }
        except Exception:
            pass
        
        return memory_details
    
    def _get_memory_info_linux(self):
        """Get Linux-specific memory information."""
        memory_details = {}
        try:
            with open('/proc/meminfo', 'r') as f:
                meminfo = f.read()
                
                for line in meminfo.split('\n'):
                    if 'MemTotal:' in line:
                        total_kb = int(line.split()[1])
                        memory_details['total_physical'] = f"{total_kb / (1024**2):.2f} GB"
                    elif 'SwapTotal:' in line:
                        swap_kb = int(line.split()[1])
                        memory_details['swap_total'] = f"{swap_kb / (1024**2):.2f} GB"
            
            try:
                result = subprocess.run(['dmidecode', '-t', 'memory'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    slots = []
                    current_slot = {}
                    
                    for line in result.stdout.split('\n'):
                        if 'Memory Device' in line:
                            if current_slot:
                                slots.append(current_slot)
                            current_slot = {}
                        elif 'Size:' in line and 'No Module' not in line:
                            current_slot['capacity'] = line.split(':')[1].strip()
                        elif 'Speed:' in line:
                            current_slot['speed'] = line.split(':')[1].strip()
                        elif 'Type:' in line:
                            current_slot['type'] = line.split(':')[1].strip()
                    
                    if current_slot:
                        slots.append(current_slot)
                    
                    memory_details['slots'] = [slot for slot in slots if slot.get('capacity')]
            except:
                pass
                
        except Exception:
            pass
        
        return memory_details
    
    def _get_memory_info_macos(self):
        """Get macOS-specific memory information."""
        memory_details = {}
        try:
            result = subprocess.run(['system_profiler', 'SPMemoryDataType'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                slots = []
                lines = result.stdout.split('\n')
                
                current_slot = {}
                for line in lines:
                    line = line.strip()
                    if 'DIMM' in line and ':' in line:
                        if current_slot:
                            slots.append(current_slot)
                        current_slot = {'slot_name': line.split(':')[0]}
                    elif 'Size:' in line:
                        current_slot['capacity'] = line.split(':')[1].strip()
                    elif 'Speed:' in line:
                        current_slot['speed'] = line.split(':')[1].strip()
                    elif 'Type:' in line:
                        current_slot['type'] = line.split(':')[1].strip()
                
                if current_slot:
                    slots.append(current_slot)
                
                memory_details['slots'] = slots
        except Exception:
            pass
        
        return memory_details
    
    def _get_storage_info(self):
        """Get detailed storage information."""
        storage_info = {
            'drives': [],
            'total_capacity': '0 GB',
            'partitions': []  # Keep empty array for compatibility
        }
        
        # Get storage drives using OS-specific methods (no partition scanning)
        if self.system == 'windows':
            storage_info['drives'].extend(self._get_storage_info_windows())
        elif self.system == 'linux':
            storage_info['drives'].extend(self._get_storage_info_linux())
        elif self.system == 'darwin':
            storage_info['drives'].extend(self._get_storage_info_macos())
        
        # Calculate total capacity from drives
        total_capacity = 0
        for drive in storage_info['drives']:
            if 'size' in drive and drive['size'] != 'Unknown':
                try:
                    # Extract numeric value from size string (e.g., "500.0 GB" -> 500.0)
                    size_str = drive['size'].replace(' GB', '').replace(' TB', '000')
                    if 'TB' in drive['size']:
                        size_str = size_str.replace('000', '')
                        total_capacity += float(size_str) * 1000  # Convert TB to GB
                    else:
                        total_capacity += float(size_str)
                except (ValueError, AttributeError):
                    continue
        
        storage_info['total_capacity'] = f"{total_capacity:.2f} GB"
        
        return storage_info
    
    def _get_storage_info_windows(self):
        """Get Windows-specific storage information."""
        drives = []
        try:
            cmd = '''
            Get-WmiObject -Class Win32_DiskDrive | 
            Select-Object Model, Size, MediaType, InterfaceType | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if not isinstance(data, list):
                    data = [data]
                
                for drive in data:
                    size_gb = int(drive.get('Size', 0)) / (1024**3) if drive.get('Size') else 0
                    drives.append({
                        'model': drive.get('Model', 'Unknown'),
                        'size': f"{size_gb:.2f} GB",
                        'media_type': drive.get('MediaType', 'Unknown'),
                        'interface': drive.get('InterfaceType', 'Unknown')
                    })
        except Exception:
            pass
        
        return drives
    
    def _get_storage_info_linux(self):
        """Get Linux-specific storage information."""
        drives = []
        try:
            result = subprocess.run(['lsblk', '-d', '-o', 'NAME,SIZE,MODEL,TRAN'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')[1:]
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 2:
                        drives.append({
                            'device': f"/dev/{parts[0]}",
                            'size': parts[1] if len(parts) > 1 else 'Unknown',
                            'model': parts if len(parts) > 2 else 'Unknown',
                            'transport': parts if len(parts) > 3 else 'Unknown'
                        })
        except Exception:
            pass
        
        return drives
    
    def _get_storage_info_macos(self):
        """Get macOS-specific storage information."""
        drives = []
        try:
            result = subprocess.run(['system_profiler', 'SPStorageDataType'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                current_drive = {}
                
                for line in lines:
                    line = line.strip()
                    if ':' in line and not line.startswith(' '):
                        if current_drive:
                            drives.append(current_drive)
                        current_drive = {'name': line.split(':')[0]}
                    elif 'Capacity:' in line:
                        current_drive['capacity'] = line.split(':')[1].strip()
                    elif 'Available:' in line:
                        current_drive['available'] = line.split(':')[1].strip()
                
                if current_drive:
                    drives.append(current_drive)
        except Exception:
            pass
        
        return drives
    
    def _get_network_hardware(self):
        """Get network hardware information."""
        network_info = {'interfaces': []}
        
        if PSUTIL_AVAILABLE:
            interfaces = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
            
            for interface_name, addresses in interfaces.items():
                interface_info = {
                    'name': interface_name,
                    'addresses': [],
                    'is_up': stats.get(interface_name, {}).isup if stats.get(interface_name) else False,
                    'speed': f"{stats.get(interface_name, {}).speed} Mbps" if stats.get(interface_name) else 'Unknown'
                }
                
                for addr in addresses:
                    if addr.family.name == 'AF_INET':
                        interface_info['addresses'].append({
                            'type': 'IPv4',
                            'address': addr.address,
                            'netmask': addr.netmask,
                            'broadcast': addr.broadcast
                        })
                    elif addr.family.name == 'AF_PACKET':
                        interface_info['mac_address'] = addr.address
                
                network_info['interfaces'].append(interface_info)
        
        return network_info
    
    def _get_graphics_info(self):
        """Get graphics/GPU information."""
        graphics_info = {'gpus': []}
        
        if GPUTIL_AVAILABLE:
            try:
                gpus = GPUtil.getGPUs()
                for gpu in gpus:
                    graphics_info['gpus'].append({
                        'name': gpu.name,
                        'memory_total': f"{gpu.memoryTotal} MB",
                        'memory_used': f"{gpu.memoryUsed} MB",
                        'memory_free': f"{gpu.memoryFree} MB",
                        'temperature': f"{gpu.temperature}°C",
                        'load': f"{gpu.load * 100:.1f}%",
                        'uuid': gpu.uuid
                    })
            except Exception:
                pass
        
        if self.system == 'windows':
            graphics_info['gpus'].extend(self._get_graphics_info_windows())
        elif self.system == 'linux':
            graphics_info['gpus'].extend(self._get_graphics_info_linux())
        elif self.system == 'darwin':
            graphics_info['gpus'].extend(self._get_graphics_info_macos())
        
        return graphics_info
    
    def _get_graphics_info_windows(self):
        """Get Windows-specific graphics information."""
        gpus = []
        try:
            cmd = '''
            Get-WmiObject -Class Win32_VideoController | 
            Select-Object Name, AdapterRAM, DriverVersion, VideoProcessor | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if not isinstance(data, list):
                    data = [data]
                
                for gpu in data:
                    ram_gb = int(gpu.get('AdapterRAM', 0)) / (1024**3) if gpu.get('AdapterRAM') else 0
                    gpus.append({
                        'name': gpu.get('Name', 'Unknown'),
                        'memory': f"{ram_gb:.2f} GB" if ram_gb > 0 else 'Unknown',
                        'driver_version': gpu.get('DriverVersion', 'Unknown'),
                        'processor': gpu.get('VideoProcessor', 'Unknown')
                    })
        except Exception:
            pass
        
        return gpus
    
    def _get_graphics_info_linux(self):
        """Get Linux-specific graphics information."""
        gpus = []
        try:
            result = subprocess.run(['lspci'], capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'VGA compatible controller' in line or 'Display controller' in line:
                        gpu_name = line.split(': ')[1] if ': ' in line else line
                        gpus.append({
                            'name': gpu_name,
                            'type': 'Graphics Controller'
                        })
        except Exception:
            pass
        
        return gpus
    
    def _get_graphics_info_macos(self):
        """Get macOS-specific graphics information."""
        gpus = []
        try:
            result = subprocess.run(['system_profiler', 'SPDisplaysDataType'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                current_gpu = {}
                
                for line in lines:
                    line = line.strip()
                    if ':' in line and not line.startswith(' '):
                        if current_gpu:
                            gpus.append(current_gpu)
                        current_gpu = {'name': line.split(':')[0]}
                    elif 'VRAM' in line:
                        current_gpu['memory'] = line.split(':')[1].strip()
                    elif 'Vendor:' in line:
                        current_gpu['vendor'] = line.split(':')[1].strip()
                
                if current_gpu:
                    gpus.append(current_gpu)
        except Exception:
            pass
        
        return gpus
    
    def _get_motherboard_info(self):
        """Get motherboard and BIOS information."""
        motherboard_info = {}
        
        if self.system == 'windows':
            motherboard_info.update(self._get_motherboard_info_windows())
        elif self.system == 'linux':
            motherboard_info.update(self._get_motherboard_info_linux())
        elif self.system == 'darwin':
            motherboard_info.update(self._get_motherboard_info_macos())
        
        return motherboard_info
    
    def _get_motherboard_info_windows(self):
        """Get Windows motherboard information."""
        mb_info = {}
        try:
            cmd_mb = '''
            Get-WmiObject -Class Win32_BaseBoard | 
            Select-Object Manufacturer, Product, Version, SerialNumber | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd_mb], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                mb_info = {
                    'manufacturer': data.get('Manufacturer', 'Unknown'),
                    'model': data.get('Product', 'Unknown'),
                    'version': data.get('Version', 'Unknown'),
                    'serial_number': data.get('SerialNumber', 'Unknown')
                }
            
            cmd_bios = '''
            Get-WmiObject -Class Win32_BIOS | 
            Select-Object Manufacturer, SMBIOSBIOSVersion, ReleaseDate | 
            ConvertTo-Json
            '''
            result = subprocess.run(['powershell', '-Command', cmd_bios], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                mb_info['bios'] = {
                    'manufacturer': data.get('Manufacturer', 'Unknown'),
                    'version': data.get('SMBIOSBIOSVersion', 'Unknown'),
                    'release_date': data.get('ReleaseDate', 'Unknown')
                }
        except Exception:
            pass
        
        return mb_info
    
    def _get_motherboard_info_linux(self):
        """Get Linux motherboard information."""
        mb_info = {}
        try:
            result = subprocess.run(['dmidecode', '-t', 'baseboard'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'Manufacturer:' in line:
                        mb_info['manufacturer'] = line.split(':')[1].strip()
                    elif 'Product Name:' in line:
                        mb_info['model'] = line.split(':')[1].strip()
                    elif 'Version:' in line:
                        mb_info['version'] = line.split(':')[1].strip()
                    elif 'Serial Number:' in line:
                        mb_info['serial_number'] = line.split(':')[1].strip()
        except Exception:
            pass
        
        return mb_info
    
    def _get_motherboard_info_macos(self):
        """Get macOS motherboard information."""
        mb_info = {}
        try:
            result = subprocess.run(['system_profiler', 'SPHardwareDataType'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'Model Identifier:' in line:
                        mb_info['model'] = line.split(':')[1].strip()
                    elif 'Serial Number:' in line:
                        mb_info['serial_number'] = line.split(':')[1].strip()
                    elif 'Boot ROM Version:' in line:
                        mb_info['boot_rom'] = line.split(':')[1].strip()
        except Exception:
            pass
        
        return mb_info
    
    def _get_power_thermal_info(self):
        """Get power and thermal information."""
        power_thermal = {}
        
        if PSUTIL_AVAILABLE:
            try:
                battery = psutil.sensors_battery()
                if battery:
                    power_thermal['battery'] = {
                        'percent': f"{battery.percent}%",
                        'power_plugged': battery.power_plugged,
                        'time_left': str(battery.secsleft) if battery.secsleft != psutil.POWER_TIME_UNLIMITED else 'Unlimited'
                    }
            except:
                pass
            
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    power_thermal['temperatures'] = {}
                    for name, entries in temps.items():
                        power_thermal['temperatures'][name] = []
                        for entry in entries:
                            power_thermal['temperatures'][name].append({
                                'label': entry.label or 'Unknown',
                                'current': f"{entry.current}°C",
                                'high': f"{entry.high}°C" if entry.high else 'N/A',
                                'critical': f"{entry.critical}°C" if entry.critical else 'N/A'
                            })
            except:
                pass
        
        return power_thermal
    
    def _get_mac_address(self):
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

    
    # def export_hardware_info(self, filename=None):
    #     """Export hardware information to JSON."""
    #     if filename is None:
    #         filename = f"hardware_info_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
    #     try:
    #         with open(filename, 'w', encoding='utf-8') as f:
    #             json.dump(self.hardware_info, f, indent=2, ensure_ascii=False)
    #         return filename
    #     except Exception:
    #         return None


def main():
    """Main function - detect hardware and export to JSON."""
    import requests

    detector = HardwareDetector()
    hardware_data = detector.get_comprehensive_hardware_info()

    response = requests.post('http://localhost:3000/api/hardware/', json=hardware_data)
    print(response.status_code, response.json())
    # detector = HardwareDetector()
    # detector.get_comprehensive_hardware_info()
    return detector


if __name__ == "__main__":
    main()
    
