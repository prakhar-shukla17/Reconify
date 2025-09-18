#!/usr/bin/env python3
"""
Generate test telemetry data to demonstrate ML predictions
This script simulates various system scenarios to test the ML algorithms
"""

import requests
import time
import random
import math
from datetime import datetime, timedelta

API_URL = "http://localhost:3000/api/telemetry"

def get_mac_address():
    """Get a consistent MAC address for testing"""
    return "FE:80::A2:6C:AA:3A:98:95:FD:EC"

def simulate_normal_usage():
    """Simulate normal system usage patterns"""
    base_time = time.time()
    
    # Normal usage with slight variations
    cpu = random.uniform(5, 25)
    ram = random.uniform(40, 60)
    storage = random.uniform(65, 75)
    
    return {
        "mac_address": get_mac_address(),
        "cpu_percent": round(cpu, 1),
        "ram_percent": round(ram, 1),
        "storage_percent": round(storage, 1),
        "temperature": round(random.uniform(45, 65), 1)
    }

def simulate_storage_growth(day_offset=0):
    """Simulate storage growing over time"""
    # Storage grows 0.5-2% per day
    base_storage = 70
    growth_rate = 1.2  # % per day
    storage = base_storage + (growth_rate * day_offset) + random.uniform(-2, 2)
    
    return {
        "mac_address": get_mac_address(),
        "cpu_percent": round(random.uniform(8, 20), 1),
        "ram_percent": round(random.uniform(45, 65), 1),
        "storage_percent": round(min(98, max(50, storage)), 1),
        "temperature": round(random.uniform(50, 70), 1)
    }

def simulate_memory_leak(hour_offset=0):
    """Simulate a memory leak scenario"""
    # Memory gradually increases
    base_memory = 50
    leak_rate = 1.5  # % per hour
    memory = base_memory + (leak_rate * hour_offset) + random.uniform(-1, 1)
    
    return {
        "mac_address": get_mac_address(),
        "cpu_percent": round(random.uniform(10, 25), 1),
        "ram_percent": round(min(95, max(40, memory)), 1),
        "storage_percent": round(random.uniform(70, 75), 1),
        "temperature": round(random.uniform(55, 75), 1)
    }

def simulate_cpu_spikes():
    """Simulate CPU spike patterns"""
    # Random CPU spikes
    if random.random() < 0.3:  # 30% chance of spike
        cpu = random.uniform(85, 98)
    else:
        cpu = random.uniform(10, 30)
    
    return {
        "mac_address": get_mac_address(),
        "cpu_percent": round(cpu, 1),
        "ram_percent": round(random.uniform(50, 70), 1),
        "storage_percent": round(random.uniform(72, 78), 1),
        "temperature": round(random.uniform(60, 85), 1)
    }

def simulate_degrading_performance(day_offset=0):
    """Simulate gradually degrading system performance"""
    # All metrics slowly getting worse
    degradation_factor = day_offset * 0.8  # Gets worse over time
    
    cpu = 15 + degradation_factor + random.uniform(-3, 3)
    ram = 55 + degradation_factor + random.uniform(-5, 5)
    storage = 73 + (degradation_factor * 0.5) + random.uniform(-2, 2)
    temp = 60 + (degradation_factor * 0.3) + random.uniform(-5, 5)
    
    return {
        "mac_address": get_mac_address(),
        "cpu_percent": round(min(95, max(5, cpu)), 1),
        "ram_percent": round(min(95, max(30, ram)), 1),
        "storage_percent": round(min(95, max(60, storage)), 1),
        "temperature": round(min(90, max(40, temp)), 1)
    }

def send_telemetry_data(data):
    """Send telemetry data to the API"""
    try:
        response = requests.post(API_URL, json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Sent: CPU={data['cpu_percent']}% RAM={data['ram_percent']}% Storage={data['storage_percent']}% | Health: {result.get('health_status', 'unknown')} ({result.get('health_score', 0)})")
            return True
        else:
            print(f"✗ Error {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Failed to send data: {e}")
        return False

def run_scenario(scenario_name, data_generator, count=10, delay=2):
    """Run a specific scenario"""
    print(f"\n🚀 Running scenario: {scenario_name}")
    print(f"Sending {count} data points with {delay}s delay...")
    
    successful = 0
    for i in range(count):
        if scenario_name == "Storage Growth":
            data = data_generator(day_offset=i)
        elif scenario_name == "Memory Leak":
            data = data_generator(hour_offset=i)
        elif scenario_name == "Performance Degradation":
            data = data_generator(day_offset=i)
        else:
            data = data_generator()
        
        if send_telemetry_data(data):
            successful += 1
        
        if i < count - 1:  # Don't delay after last item
            time.sleep(delay)
    
    print(f"✓ Completed {scenario_name}: {successful}/{count} successful")
    return successful

def main():
    """Main function to run different test scenarios"""
    print("🧪 ML Telemetry Data Generator")
    print("=" * 50)
    
    scenarios = [
        ("Normal Usage", simulate_normal_usage, 5, 1),
        ("Storage Growth", simulate_storage_growth, 10, 1),
        ("Memory Leak", simulate_memory_leak, 8, 1),
        ("CPU Spikes", simulate_cpu_spikes, 6, 2),
        ("Performance Degradation", simulate_degrading_performance, 12, 1),
    ]
    
    print("Available scenarios:")
    for i, (name, _, count, _) in enumerate(scenarios, 1):
        print(f"{i}. {name} ({count} data points)")
    
    print("0. Run all scenarios")
    print("q. Quit")
    
    while True:
        choice = input("\nSelect scenario (0-5, q): ").strip().lower()
        
        if choice == 'q':
            print("👋 Goodbye!")
            break
        elif choice == '0':
            print("\n🚀 Running all scenarios...")
            total_success = 0
            total_sent = 0
            
            for name, generator, count, delay in scenarios:
                success = run_scenario(name, generator, count, delay)
                total_success += success
                total_sent += count
                time.sleep(3)  # Pause between scenarios
            
            print(f"\n🎉 All scenarios completed!")
            print(f"Total: {total_success}/{total_sent} successful")
            break
        elif choice.isdigit() and 1 <= int(choice) <= len(scenarios):
            idx = int(choice) - 1
            name, generator, count, delay = scenarios[idx]
            run_scenario(name, generator, count, delay)
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()

