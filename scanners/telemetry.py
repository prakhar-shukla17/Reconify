import psutil
import platform
import subprocess
import json
import requests
from datetime import datetime

# Optional imports with fallbacks
try:
    import GPUtil
    GPUTIL_AVAILABLE = True
except ImportError:
    GPUTIL_AVAILABLE = False

try:
    import pynvml
    PYNVML_AVAILABLE = True
except ImportError:
    PYNVML_AVAILABLE = False

class SystemTelemetry:
    def __init__(self):
        self.os_name = platform.system().lower()
        self.os_version = platform.release()
        self.architecture = platform.machine()
        
    def get_cpu_usage(self):
        """Get CPU usage across all platforms"""
        try:
            return {
                "usage_percent": psutil.cpu_percent(interval=1),
                "core_count": psutil.cpu_count(logical=False),
                "thread_count": psutil.cpu_count(logical=True),
                "frequency_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else None,
                "temperature": self._get_cpu_temperature()
            }
        except Exception as e:
            return {"error": str(e), "usage_percent": 0}

    def get_ram_usage(self):
        """Get RAM usage across all platforms"""
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                "used_gb": round(mem.used / (1024 ** 3), 2),
                "total_gb": round(mem.total / (1024 ** 3), 2),
                "available_gb": round(mem.available / (1024 ** 3), 2),
                "percent": mem.percent,
                "swap_used_gb": round(swap.used / (1024 ** 3), 2),
                "swap_total_gb": round(swap.total / (1024 ** 3), 2),
                "swap_percent": swap.percent
            }
        except Exception as e:
            return {"error": str(e)}

    def get_gpu_usage(self):
        """Get GPU usage for all platforms and GPU types"""
        gpu_data = []
        
        # Try NVIDIA GPUs first
        gpu_data.extend(self._get_nvidia_gpu())
        
        # Try AMD GPUs
        gpu_data.extend(self._get_amd_gpu())
        
        # Try Intel GPUs
        gpu_data.extend(self._get_intel_gpu())
        
        # Fallback to system-specific methods
        if not gpu_data:
            gpu_data.extend(self._get_platform_specific_gpu())
            
        return gpu_data

    def _get_nvidia_gpu(self):
        """Get NVIDIA GPU info using multiple methods"""
        gpus = []
        
        # Method 1: GPUtil
        if GPUTIL_AVAILABLE:
            try:
                nvidia_gpus = GPUtil.getGPUs()
                for gpu in nvidia_gpus:
                    gpus.append({
                        "name": gpu.name,
                        "brand": "NVIDIA",
                        "load_percent": round(gpu.load * 100, 1),
                        "memory_used_mb": gpu.memoryUsed,
                        "memory_total_mb": gpu.memoryTotal,
                        "memory_free_mb": gpu.memoryFree,
                        "temperature_c": gpu.temperature,
                        "uuid": gpu.uuid
                    })
            except:
                pass
        
        # Method 2: PYNVML
        if PYNVML_AVAILABLE and not gpus:
            try:
                pynvml.nvmlInit()
                device_count = pynvml.nvmlDeviceGetCount()
                for i in range(device_count):
                    handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                    name = pynvml.nvmlDeviceGetName(handle).decode('utf-8')
                    
                    # Get utilization
                    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    
                    # Get memory info
                    mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    
                    # Get temperature
                    try:
                        temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                    except:
                        temp = None
                    
                    gpus.append({
                        "name": name,
                        "brand": "NVIDIA",
                        "load_percent": util.gpu,
                        "memory_used_mb": round(mem_info.used / (1024**2)),
                        "memory_total_mb": round(mem_info.total / (1024**2)),
                        "memory_free_mb": round(mem_info.free / (1024**2)),
                        "temperature_c": temp
                    })
            except:
                pass
        
        # Method 3: nvidia-smi command line
        if not gpus:
            try:
                result = subprocess.run(['nvidia-smi', '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu', '--format=csv,noheader,nounits'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        if line.strip():
                            parts = [p.strip() for p in line.split(',')]
                            if len(parts) >= 5:
                                gpus.append({
                                    "name": parts[0],
                                    "brand": "NVIDIA",
                                    "load_percent": float(parts) if parts != '[Not Supported]' else None,
                                    "memory_used_mb": float(parts[asset:1]) if parts[asset:1] != '[Not Supported]' else None,
                                    "memory_total_mb": float(parts[1]) if parts[1] != '[Not Supported]' else None,
                                    "temperature_c": float(parts[2]) if parts[2] != '[Not Supported]' else None
                                })
            except:
                pass
                
        return gpus

    def _get_amd_gpu(self):
        """Get AMD GPU info"""
        gpus = []
        
        if self.os_name == 'linux':
            try:
                # Try radeontop or rocm-smi
                result = subprocess.run(['rocm-smi', '--showuse', '--showmeminfo', '--showtemp'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    # Parse rocm-smi output (simplified)
                    gpus.append({
                        "name": "AMD GPU",
                        "brand": "AMD",
                        "load_percent": None,  # Would need parsing
                        "memory_used_mb": None,
                        "memory_total_mb": None,
                        "temperature_c": None
                    })
            except:
                pass
        
        elif self.os_name == 'windows':
            # Could use WMI queries for AMD
            pass
            
        return gpus

    def _get_intel_gpu(self):
        """Get Intel GPU info"""
        gpus = []
        
        if self.os_name == 'linux':
            try:
                # Try intel_gpu_top
                result = subprocess.run(['intel_gpu_top', '-l'], 
                                      capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    gpus.append({
                        "name": "Intel GPU",
                        "brand": "Intel",
                        "load_percent": None,  # Would need parsing
                        "memory_used_mb": None,
                        "memory_total_mb": None,
                        "temperature_c": None
                    })
            except:
                pass
                
        return gpus

    def _get_platform_specific_gpu(self):
        """Platform-specific GPU detection methods"""
        gpus = []
        
        if self.os_name == 'windows':
            gpus.extend(self._get_windows_gpu())
        elif self.os_name == 'darwin':  # macOS
            gpus.extend(self._get_macos_gpu())
        elif self.os_name == 'linux':
            gpus.extend(self._get_linux_gpu())
            
        return gpus

    def _get_windows_gpu(self):
        """Get GPU info on Windows using WMI"""
        gpus = []
        try:
            import wmi
            c = wmi.WMI()
            for gpu in c.Win32_VideoController():
                if gpu.Name:
                    gpus.append({
                        "name": gpu.Name,
                        "brand": "Unknown",
                        "memory_total_mb": gpu.AdapterRAM // (1024**2) if gpu.AdapterRAM else None,
                        "driver_version": gpu.DriverVersion,
                        "load_percent": None,
                        "temperature_c": None
                    })
        except:
            # Fallback to PowerShell
            try:
                result = subprocess.run(['powershell', '-Command', 
                    'Get-WmiObject -Class Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json'], 
                    capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    if isinstance(data, list):
                        for gpu in data:
                            if gpu.get('Name'):
                                gpus.append({
                                    "name": gpu['Name'],
                                    "brand": "Unknown",
                                    "memory_total_mb": gpu['AdapterRAM'] // (1024**2) if gpu.get('AdapterRAM') else None,
                                    "load_percent": None,
                                    "temperature_c": None
                                })
            except:
                pass
                
        return gpus

    def _get_macos_gpu(self):
        """Get GPU info on macOS"""
        gpus = []
        try:
            result = subprocess.run(['system_profiler', 'SPDisplaysDataType', '-json'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                displays = data.get('SPDisplaysDataType', [])
                for display in displays:
                    if 'sppci_model' in display:
                        gpus.append({
                            "name": display.get('sppci_model', 'Unknown GPU'),
                            "brand": "Apple/Intel/AMD",
                            "memory_total_mb": None,  # macOS doesn't easily expose this
                            "load_percent": None,
                            "temperature_c": None
                        })
        except:
            pass
            
        return gpus

    def _get_linux_gpu(self):
        """Get GPU info on Linux"""
        gpus = []
        try:
            # Try lspci
            result = subprocess.run(['lspci', '-nn'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'VGA compatible controller' in line or 'Display controller' in line:
                        gpu_name = line.split(': ', 1)[1] if ': ' in line else line
                        brand = "Unknown"
                        if 'NVIDIA' in gpu_name.upper():
                            brand = "NVIDIA"
                        elif 'AMD' in gpu_name.upper() or 'ATI' in gpu_name.upper():
                            brand = "AMD"
                        elif 'INTEL' in gpu_name.upper():
                            brand = "Intel"
                        
                        gpus.append({
                            "name": gpu_name.strip(),
                            "brand": brand,
                            "load_percent": None,
                            "memory_used_mb": None,
                            "memory_total_mb": None,
                            "temperature_c": None
                        })
        except:
            pass
            
        return gpus

    def _get_cpu_temperature(self):
        """Get CPU temperature if available"""
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    # Try common temperature sensor names
                    for name in ['coretemp', 'k10temp', 'cpu_thermal', 'acpi']:
                        if name in temps:
                            return round(temps[name][0].current, 1)
        except:
            pass
        return None

    def get_system_info(self):
        """Get basic system information"""
        return {
            "hostname": platform.node(),
            "os": self.os_name,
            "os_version": self.os_version,
            "architecture": self.architecture,
            "python_version": platform.python_version(),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            "uptime_seconds": int(psutil.time.time() - psutil.boot_time())
        }

    def collect_all_telemetry(self):
        """Collect all telemetry data"""
        return {
            "timestamp": datetime.now().isoformat(),
            "system": self.get_system_info(),
            "cpu": self.get_cpu_usage(),
            "ram": self.get_ram_usage(),
            "gpu": self.get_gpu_usage()
        }

    def send_telemetry(self, api_url, timeout=10):
        """Send telemetry data to API"""
        try:
            telemetry_data = self.collect_all_telemetry()
            response = requests.post(
                api_url, 
                json=telemetry_data,
                timeout=timeout,
                headers={'Content-Type': 'application/json'}
            )
            return {
                "success": True,
                "status_code": response.status_code,
                "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Usage example
def main():
    telemetry = SystemTelemetry()
    
    # Get telemetry data (without printing)
    data = telemetry.collect_all_telemetry()
    
    # Send to API
    # result = telemetry.send_telemetry("http://localhost:3000/api/telemetry")
    print(data)
    # return result  # Don't print, just return

if __name__ == "__main__":
    result = main()
    # print(result)
