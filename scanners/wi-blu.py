import subprocess
import platform
import json
import re
from datetime import datetime

class WiFiBluetoothDetector:
    def __init__(self):
        self.system = platform.system().lower()
        self.results = {
            'wifi': {
                'adapters': [],
                'working': False
            },
            'bluetooth': {
                'working': False
            }
        }
    def retu(self):
        return self.results

    def check_wifi_status(self):
        try:
            if self.system == 'windows':
                self._check_wifi_windows()
            elif self.system == 'linux':
                self._check_wifi_linux()
            elif self.system == 'darwin':
                self._check_wifi_macos()
        except Exception:
            pass
        self.results['wifi']['working'] = (
            len(self.results['wifi']['adapters']) > 0 and
            any(adapter.get('status', '').lower() in ['up', 'enabled', 'connected', 'active']
                for adapter in self.results['wifi']['adapters'])
        )
        return self.results['wifi']

    def _check_wifi_windows(self):
        cmd = '''
        Get-NetAdapter | Where-Object {$_.Name -like "*Wi-Fi*" -or $_.Name -like "*Wireless*"} |
        Select-Object Name, Status, LinkSpeed, InterfaceDescription |
        ConvertTo-Json
        '''
        result = subprocess.run(['powershell', '-Command', cmd],
                                capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            try:
                adapters_data = json.loads(result.stdout)
                if isinstance(adapters_data, dict):
                    adapters_data = [adapters_data]
                for adapter in adapters_data:
                    self.results['wifi']['adapters'].append({
                        'name': adapter.get('Name', 'Unknown'),
                        'status': adapter.get('Status', 'Unknown'),
                        'speed': adapter.get('LinkSpeed', 'Unknown'),
                        'description': adapter.get('InterfaceDescription', '')
                    })
            except json.JSONDecodeError:
                pass

    def _check_wifi_linux(self):
        try:
            result = subprocess.run(['iwconfig'], capture_output=True, text=True, stderr=subprocess.DEVNULL)
            if result.returncode == 0:
                current_interface = {}
                for line in result.stdout.split('\n'):
                    if line and not line.startswith(' '):
                        if current_interface and 'IEEE 802.11' in line:
                            self.results['wifi']['adapters'].append(current_interface)
                        if 'IEEE 802.11' in line:
                            interface_name = line.split()[0]
                            current_interface = {
                                'name': interface_name,
                                'type': 'WiFi',
                                'status': 'unknown'
                            }
                    elif line.strip().startswith('ESSID:') and current_interface:
                        essid = line.split('ESSID:')[1].strip().strip('"')
                        if essid and essid != 'off/any':
                            current_interface['status'] = 'connected'
                    elif 'Link Quality' in line and current_interface:
                        quality_match = re.search(r'Link Quality=(\d+/\d+)', line)
                        if quality_match:
                            current_interface['signal_quality'] = quality_match.group(1)
                if current_interface and 'IEEE 802.11' in str(current_interface):
                    self.results['wifi']['adapters'].append(current_interface)
        except FileNotFoundError:
            pass

    def _check_wifi_macos(self):
        result = subprocess.run(['networksetup', '-getairportnetwork', 'en0'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            output = result.stdout.strip()
            if 'Current Wi-Fi Network:' in output:
                self.results['wifi']['adapters'].append({
                    'name': 'en0',
                    'status': 'connected'
                })
            else:
                self.results['wifi']['adapters'].append({
                    'name': 'en0',
                    'status': 'not connected'
                })
        result = subprocess.run(['networksetup', '-getairportpower', 'en0'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            if 'On' in result.stdout:
                if self.results['wifi']['adapters']:
                    self.results['wifi']['adapters'][0]['power'] = 'on'
            else:
                if self.results['wifi']['adapters']:
                    self.results['wifi']['adapters']['power'] = 'off'

    def check_bluetooth_status(self):
        try:
            if self.system == 'windows':
                self._check_bluetooth_windows()
            elif self.system == 'linux':
                self._check_bluetooth_linux()
            elif self.system == 'darwin':
                self._check_bluetooth_macos()
        except Exception:
            pass
        self.results['bluetooth']['working'] = len(self.results['bluetooth']) > 0
        return self.results['bluetooth']

    def _check_bluetooth_windows(self):
        pass  # simplified (not storing adapters/devices/status)

    def _check_bluetooth_linux(self):
        pass  # simplified (not storing adapters/devices/status)

    def _check_bluetooth_macos(self):
        pass  # simplified (not storing adapters/devices/status)

    def run_complete_check(self):
        self.check_wifi_status()
        self.check_bluetooth_status()
        self.export_to_json()
        return self.results

    def export_to_json(self, filename=None):
        if filename is None:
            filename = f"wifi_bluetooth_status_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            return filename
        except Exception:
            return None

def main():
    detector = WiFiBluetoothDetector()
    results = detector.run_complete_check()
    return results

if __name__ == "__main__":
    main()
   
    
