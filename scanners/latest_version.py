import subprocess
import json
import sys
import platform
from datetime import datetime

def get_installed_apps():
    """Fetch installed apps using winget list"""
    try:
        result = subprocess.run(
            ["winget", "list"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print("Error fetching installed apps:", e)
        return None

def get_upgradable_apps():
    """Fetch apps with available updates using winget upgrade"""
    try:
        result = subprocess.run(
            ["winget", "upgrade"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print("Error fetching upgradable apps:", e)
        return None

def parse_winget_upgrade_output(output):
    """Parse winget upgrade output into a structured list of dicts"""
    lines = output.strip().splitlines()
    if len(lines) < 3:
        return []
    
    # Find the header line (contains "Name", "Id", "Version", etc.)
    header_line = None
    data_start_index = 0
    
    for i, line in enumerate(lines):
        if "Name" in line and "Id" in line and "Version" in line:
            header_line = line
            data_start_index = i + 2  # Skip header and separator line
            break
    
    if header_line is None:
        return []
    
    # Find column positions based on header
    name_start = header_line.find("Name")
    id_start = header_line.find("Id")
    version_start = header_line.find("Version")
    available_start = header_line.find("Available")
    source_start = header_line.find("Source")
    
    apps = []
    current_app = None
    
    for line in lines[data_start_index:]:
        if not line.strip() or line.startswith("-"):
            continue
        
        # Check if this line starts a new app entry (has content at name_start position)
        if len(line) > name_start and line[name_start] != ' ':
            # Save previous app if it exists
            if current_app and current_app.get("name") and current_app.get("current_version"):
                apps.append(current_app)
            
            # Start new app entry
            name = line[name_start:id_start].strip() if id_start > name_start else line[name_start:].strip()
            app_id = line[id_start:version_start].strip() if version_start > id_start else ""
            current_version = line[version_start:available_start].strip() if available_start > version_start else ""
            available_version = line[available_start:source_start].strip() if source_start > available_start else line[available_start:].strip()
            
            # Clean up special characters and encoding issues
            name = name.encode('ascii', 'ignore').decode('ascii').strip()
            app_id = app_id.encode('ascii', 'ignore').decode('ascii').strip()
            current_version = current_version.encode('ascii', 'ignore').decode('ascii').strip()
            available_version = available_version.encode('ascii', 'ignore').decode('ascii').strip()
            
            # Remove extra whitespace and clean up version strings
            current_version = ' '.join(current_version.split())
            available_version = ' '.join(available_version.split())
            
            current_app = {
                "name": name,
                "id": app_id,
                "current_version": current_version,
                "available_version": available_version
            }
        else:
            # This might be a continuation line, skip for now
            continue
    
    # Don't forget the last app
    if current_app and current_app.get("name") and current_app.get("current_version"):
        apps.append(current_app)
    
    # Filter out apps with invalid data and clean up versions
    valid_apps = []
    for app in apps:
        if (app.get("name") and 
            app.get("current_version") and 
            app.get("available_version") and
            len(app["name"]) > 1):
            
            # Additional cleanup for version strings
            current_ver = app["current_version"].replace('¦', '').strip()
            available_ver = app["available_version"].replace('¦', '').strip()
            
            # Clean up current version
            current_parts = current_ver.split()
            if current_parts:
                for part in current_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        current_ver = part
                        break
                else:
                    current_ver = current_parts[0] if current_parts else "Unknown"
            
            # Clean up available version
            available_parts = available_ver.split()
            if available_parts:
                for part in available_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        available_ver = part
                        break
                else:
                    available_ver = available_parts[0] if available_parts else "Unknown"
            
            app["current_version"] = current_ver
            app["available_version"] = available_ver
            valid_apps.append(app)
    
    return valid_apps

def parse_winget_list_output(output):
    """Parse winget list output into a structured list of dicts"""
    lines = output.strip().splitlines()
    if len(lines) < 3:
        return []
    
    # Find the header line (contains "Name", "Id", "Version", etc.)
    header_line = None
    data_start_index = 0
    
    for i, line in enumerate(lines):
        if "Name" in line and "Id" in line and "Version" in line:
            header_line = line
            data_start_index = i + 2  # Skip header and separator line
            break
    
    if header_line is None:
        return []
    
    # Find column positions based on header
    name_start = header_line.find("Name")
    id_start = header_line.find("Id")
    version_start = header_line.find("Version")
    source_start = header_line.find("Source")
    
    apps = []
    current_app = None
    
    for line in lines[data_start_index:]:
        if not line.strip() or line.startswith("-"):
            continue
        
        # Check if this line starts a new app entry (has content at name_start position)
        if len(line) > name_start and line[name_start] != ' ':
            # Save previous app if it exists
            if current_app and current_app.get("name") and current_app.get("current_version"):
                apps.append(current_app)
            
            # Start new app entry
            name = line[name_start:id_start].strip() if id_start > name_start else line[name_start:].strip()
            app_id = line[id_start:version_start].strip() if version_start > id_start else ""
            current_version = line[version_start:source_start].strip() if source_start > version_start else line[version_start:].strip()
            
            # Clean up special characters and encoding issues
            name = name.encode('ascii', 'ignore').decode('ascii').strip()
            app_id = app_id.encode('ascii', 'ignore').decode('ascii').strip()
            current_version = current_version.encode('ascii', 'ignore').decode('ascii').strip()
            
            # Remove extra whitespace and clean up version string
            current_version = ' '.join(current_version.split())
            
            current_app = {
                "name": name,
                "id": app_id,
                "current_version": current_version
            }
        else:
            # This might be a continuation line, skip for now
            continue
    
    # Don't forget the last app
    if current_app and current_app.get("name") and current_app.get("current_version"):
        apps.append(current_app)
    
    # Filter out apps with invalid data and clean up versions
    valid_apps = []
    for app in apps:
        if (app.get("name") and 
            app.get("current_version") and
            len(app["name"]) > 1):
            
            # Additional cleanup for version strings
            version = app["current_version"]
            # Remove common artifacts and clean up
            version = version.replace('¦', '').strip()
            # If version contains multiple parts separated by spaces, take the first valid one
            version_parts = version.split()
            if version_parts:
                # Find the first part that looks like a version (contains dots or numbers)
                for part in version_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        version = part
                        break
                else:
                    version = version_parts[0] if version_parts else "Unknown"
            
            app["current_version"] = version
            valid_apps.append(app)
    
    return valid_apps

def merge_installed_with_upgradable(installed_apps, upgradable_apps):
    """Merge installed apps with available updates to show latest versions"""
    print("🔍 Merging installed apps with available updates...")
    
    # Create a lookup dictionary for upgradable apps by ID
    upgrade_lookup = {}
    for app in upgradable_apps:
        if app.get("id"):
            upgrade_lookup[app["id"]] = app
    
    # Merge the data
    apps_with_latest = []
    for app in installed_apps:
        app_id = app.get("id", "")
        
        if app_id in upgrade_lookup:
            # This app has an update available
            upgrade_info = upgrade_lookup[app_id]
            apps_with_latest.append({
                **app,
                "latest_version": upgrade_info["available_version"],
                "update_available": True
            })
        else:
            # This app is up to date (or not available for update)
            apps_with_latest.append({
                **app,
                "latest_version": app["current_version"],  # Assume current is latest
                "update_available": False
            })
    
    return apps_with_latest

def check_system_compatibility():
    """Check if the system is compatible with this script"""
    print("Checking system compatibility...")
    
    # Check OS
    if platform.system() != "Windows":
        print("ERROR: This script only works on Windows systems")
        return False
    
    # Check Python version
    if sys.version_info < (3, 6):
        print("ERROR: Python 3.6 or higher is required")
        return False
    
    # Check if winget is available
    try:
        result = subprocess.run(
            ["winget", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"SUCCESS: winget found - {version}")
            return True
        else:
            print("ERROR: winget is not available or not working properly")
            return False
    except FileNotFoundError:
        print("ERROR: winget is not installed or not in PATH")
        print("SOLUTION: Install winget from Microsoft Store or GitHub releases")
        return False
    except Exception as e:
        print(f"ERROR: Error checking winget - {e}")
        return False

def main():
    print("=== Application Version Checker ===")
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version.split()[0]}")
    
    # Check compatibility first
    if not check_system_compatibility():
        print("\nSystem compatibility check failed!")
        print("Please ensure you have:")
        print("  - Windows 10 (1709+) or Windows 11")
        print("  - winget installed (Microsoft Store or GitHub)")
        print("  - Python 3.6 or higher")
        return
    
    print("\nFetching installed apps...")
    installed = get_installed_apps()
    if not installed:
        print("❌ Failed to fetch installed apps")
        return
        
    print("✅ Successfully fetched installed apps list")
    all_apps = parse_winget_list_output(installed)
    if not all_apps:
        print("⚠️ Could not parse installed apps list")
        return
    
    print("\n🔄 Checking for updates...")
    upgradable = get_upgradable_apps()
    if not upgradable:
        print("❌ Failed to check for updates")
        return
        
    print("✅ Successfully checked for updates")
    outdated_apps = parse_winget_upgrade_output(upgradable)
    
    # Merge installed apps with update information
    apps_with_latest = merge_installed_with_upgradable(all_apps, outdated_apps)
    
    # Separate apps with and without updates
    apps_with_updates = [app for app in apps_with_latest if app.get("update_available")]
    apps_up_to_date = [app for app in apps_with_latest if not app.get("update_available")]
    
    # Create comprehensive output data
    timestamp = datetime.now().isoformat()
    output_data = {
        "timestamp": timestamp,
        "summary": {
            "total_applications": len(apps_with_latest),
            "applications_with_updates": len(apps_with_updates),
            "applications_up_to_date": len(apps_up_to_date)
        },
        "all_applications": apps_with_latest,
        "applications_with_updates": apps_with_updates,
        "applications_up_to_date": apps_up_to_date
    }
    
    # Save to JSON file
    filename = f"application_versions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"💾 Data saved to: {filename}")
    except Exception as e:
        print(f"❌ Failed to save JSON file: {e}")
    
    print(f"\n📱 All Installed Applications with Latest Versions ({len(apps_with_latest)} total):")
    print(json.dumps(apps_with_latest, indent=2))
    
    if apps_with_updates:
        print(f"\n📦 Applications with Updates Available ({len(apps_with_updates)}):")
        for app in apps_with_updates:
            print(f"  • {app['name']}: {app['current_version']} → {app['latest_version']}")
    
    if apps_up_to_date:
        print(f"\n✅ Applications Up to Date ({len(apps_up_to_date)}):")
        for app in apps_up_to_date[:10]:  # Show first 10 to avoid spam
            print(f"  • {app['name']}: {app['current_version']}")
        if len(apps_up_to_date) > 10:
            print(f"  ... and {len(apps_up_to_date) - 10} more")

if __name__ == "__main__":
    main()