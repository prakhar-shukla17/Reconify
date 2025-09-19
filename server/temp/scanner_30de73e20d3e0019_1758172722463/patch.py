
import subprocess
import json
import re
from typing import List, Dict, Optional, Tuple


class WingetManager:
    """Optimized Windows Package Manager interface"""
    
    def __init__(self):
        self.encoding_cleanup = str.maketrans('¦', '')
        self.version_pattern = re.compile(r'(\d+(?:\.\d+)*(?:[-+]\w+)?)')
    
    def _run_winget_command(self, args: List[str]) -> Optional[str]:
        """Execute winget command with error handling"""
        try:
            result = subprocess.run(
                ["winget"] + args,
                capture_output=True,
                text=True,
                check=True,
                timeout=30  # Add timeout to prevent hanging
            )
            return result.stdout
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            print(f"Error executing winget {' '.join(args)}: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        return text.encode('ascii', 'ignore').decode('ascii').translate(self.encoding_cleanup).strip()
    
    def _extract_version(self, version_text: str) -> str:
        """Extract clean version number from text"""
        if not version_text:
            return "Unknown"
        
        # Find version-like patterns
        matches = self.version_pattern.findall(version_text)
        return matches[0] if matches else version_text.split() if version_text.split() else "Unknown"
    
    def _find_column_positions(self, header_line: str) -> Dict[str, int]:
        """Find column positions in winget output header"""
        columns = {}
        for col in ["Name", "Id", "Version", "Available", "Source"]:
            pos = header_line.find(col)
            if pos != -1:
                columns[col.lower()] = pos
        return columns
    
    def _parse_winget_output(self, output: str, include_available: bool = False) -> List[Dict[str, str]]:
        """Generic parser for winget list/upgrade output"""
        if not output:
            return []
        
        lines = output.strip().splitlines()
        if len(lines) < 3:
            return []
        
        # Find header and column positions
        header_line = None
        data_start = 0
        
        for i, line in enumerate(lines):
            if all(col in line for col in ["Name", "Id", "Version"]):
                header_line = line
                data_start = i + 2
                break
        
        if not header_line:
            return []
        
        columns = self._find_column_positions(header_line)
        apps = []
        
        for line in lines[data_start:]:
            if not line.strip() or line.startswith("-"):
                continue
            
            # Only process lines that start new entries
            if len(line) <= columns.get('name', 0) or line[columns['name']] == ' ':
                continue
            
            app_data = self._extract_app_data(line, columns, include_available)
            if self._is_valid_app(app_data):
                apps.append(app_data)
        
        return apps
    
    def _extract_app_data(self, line: str, columns: Dict[str, int], include_available: bool) -> Dict[str, str]:
        """Extract app data from a single line"""
        def get_column_text(start_col: str, end_col: str = None) -> str:
            start = columns.get(start_col, 0)
            end = columns.get(end_col, len(line)) if end_col else len(line)
            return self._clean_text(line[start:end])
        
        app_data = {
            "name": get_column_text('name', 'id'),
            "id": get_column_text('id', 'version'),
            "current_version": self._extract_version(get_column_text('version', 'available' if include_available else 'source'))
        }
        
        if include_available and 'available' in columns:
            app_data["available_version"] = self._extract_version(get_column_text('available', 'source'))
        
        return app_data
    
    def _is_valid_app(self, app_data: Dict[str, str]) -> bool:
        """Check if app data is valid"""
        return (app_data.get("name") and 
                app_data.get("current_version") and 
                len(app_data["name"]) > 1 and
                app_data["current_version"] != "Unknown")
    
    def get_installed_apps(self) -> List[Dict[str, str]]:
        """Get all installed applications"""
        print("🔍 Fetching installed apps...")
        output = self._run_winget_command(["list"])
        if not output:
            return []
        
        apps = self._parse_winget_output(output, include_available=False)
        print(f"✅ Found {len(apps)} installed apps")
        return apps
    
    def get_upgradable_apps(self) -> List[Dict[str, str]]:
        """Get applications with available updates"""
        print("🔄 Checking for updates...")
        output = self._run_winget_command(["upgrade"])
        if not output:
            return []
        
        apps = self._parse_winget_output(output, include_available=True)
        print(f"✅ Found {len(apps)} apps with updates")
        return apps
    
    def merge_app_data(self, installed_apps: List[Dict], upgradable_apps: List[Dict]) -> List[Dict]:
        """Efficiently merge installed apps with update information"""
        print("🔍 Merging app data...")
        
        # Create lookup dictionary for O(1) access
        upgrade_lookup = {app["id"]: app for app in upgradable_apps if app.get("id")}
        
        merged_apps = []
        for app in installed_apps:
            app_id = app.get("id", "")
            
            if app_id in upgrade_lookup:
                upgrade_info = upgrade_lookup[app_id]
                merged_apps.append({
                    **app,
                    "latest_version": upgrade_info["available_version"],
                    "update_available": True
                })
            else:
                merged_apps.append({
                    **app,
                    "latest_version": app["current_version"],
                    "update_available": False
                })
        
        return merged_apps
    
    def generate_summary(self, apps_with_latest: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Generate summary of apps with and without updates"""
        apps_with_updates = [app for app in apps_with_latest if app.get("update_available")]
        apps_up_to_date = [app for app in apps_with_latest if not app.get("update_available")]
        
        return apps_with_updates, apps_up_to_date
    
    def save_to_json(self, data: List[Dict], filename: str = "winget_apps.json") -> bool:
        """Save app data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    "timestamp": __import__('datetime').datetime.now().isoformat(),
                    "total_apps": len(data),
                    "apps_with_updates": len([app for app in data if app.get("update_available")]),
                    "apps": data
                }, f, indent=2, ensure_ascii=False)
            print(f"💾 Data saved to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving to {filename}: {e}")
            return False


def main():
    """Main execution function"""
    winget = WingetManager()
    
    # Get installed apps
    installed_apps = winget.get_installed_apps()
    if not installed_apps:
        print("❌ No installed apps found or winget unavailable")
        return
    
    # Get upgradable apps
    upgradable_apps = winget.get_upgradable_apps()
    
    # Merge data
    apps_with_latest = winget.merge_app_data(installed_apps, upgradable_apps)
    apps_with_updates, apps_up_to_date = winget.generate_summary(apps_with_latest)
    
    # Display results
    print(f"\n📊 Summary:")
    print(f"  • Total installed apps: {len(apps_with_latest)}")
    print(f"  • Apps with updates available: {len(apps_with_updates)}")
    print(f"  • Apps up to date: {len(apps_up_to_date)}")
    
    if apps_with_updates:
        print(f"\n📦 Updates Available:")
        for app in apps_with_updates[:10]:  # Show top 10
            print(f"  • {app['name']}: {app['current_version']} → {app['latest_version']}")
        if len(apps_with_updates) > 10:
            print(f"  ... and {len(apps_with_updates) - 10} more")
    
    # Save to file
    winget.save_to_json(apps_with_latest)
    
    print(f"\n✅ Process completed successfully!")


if __name__ == "__main__":
    main()
