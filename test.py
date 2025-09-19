#!/usr/bin/env python3
"""
LAN discovery script
 - Detects local subnet (assumes /24 by default)
 - Discovers live hosts (ARP scan via scapy or ping sweep fallback)
 - Gathers hostname (reverse DNS), MAC (if available)
 - Optionally runs nmap port/OS scan (if nmap is installed)
 - Optionally attempts SSH or SNMP authenticated collection (if you provide creds)
Outputs results to `lan_discovery_results.csv`.
"""

import csv
import ipaddress
import platform
import shutil
import socket
import subprocess
import sys
import threading
import time

# Optional imports (will try to import; script will continue if not available)
try:
    from scapy.all import ARP, Ether, srp, conf  # scapy
    HAVE_SCAPY = True
except Exception:
    HAVE_SCAPY = False

try:
    import nmap  # python-nmap wrapper
    HAVE_PY_NMAP = True
except Exception:
    HAVE_PY_NMAP = False

# Optional advanced libs (used only if configured)
try:
    import paramiko  # SSH client
    HAVE_PARAMIKO = True
except Exception:
    HAVE_PARAMIKO = False

try:
    from pysnmp.hlapi import SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity, getCmd
    HAVE_PYSNMP = True
except Exception:
    HAVE_PYSNMP = False

# ---------- User configuration ----------
# If you want to run authenticated collection, set credentials here.
SSH_CREDENTIALS = [
    # {"host": "192.168.1.10", "username": "user", "password": "pass"},
    # Add dicts like above to attempt SSH info collection
]

# SNMP community strings to try (common is "public")
SNMP_COMMUNITIES = ["public"]  # add other community strings if you have them

# Nmap scanning options
RUN_NMAP = True  # set to False to skip nmap
NMAP_PORTS = "22,80,135,139,445,3389,5000,8000,8080"  # ports to probe
# ----------------------------------------

def get_local_ip():
    """Get the IP address of the default interface by opening a UDP socket."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't need to be reachable; used only to determine the local interface
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
    except Exception:
        # fallback
        local_ip = "127.0.0.1"
    finally:
        s.close()
    return local_ip

def guess_subnet_cidr(ip):
    """Simple heuristic: assume /24 on IPv4 private network."""
    try:
        # if already contains '/', return
        if "/" in ip:
            return ip
        net = ipaddress.IPv4Interface(ip + "/24").network
        return str(net)
    except Exception:
        # fallback to loopback net if something odd
        return "127.0.0.0/8"

def ping(host):
    """Ping once (platform dependent) and return True if alive."""
    param = "-n" if platform.system().lower() == "windows" else "-c"
    # timeout option
    timeout_param = "-w" if platform.system().lower() == "windows" else "-W"
    cmd = ["ping", param, "1", timeout_param, "1", host]
    try:
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return res.returncode == 0
    except Exception:
        return False

def arp_scan_scapy(network_cidr, timeout=2):
    """Perform ARP scan using scapy - returns list of dicts with ip and mac."""
    if not HAVE_SCAPY:
        raise RuntimeError("scapy not available")
    conf.verb = 0
    print(f"[+] Running ARP scan on {network_cidr} (scapy)")
    ans, _ = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst=network_cidr), timeout=timeout, retry=1)
    results = []
    for s, r in ans:
        results.append({"ip": r.psrc, "mac": r.hwsrc})
    return results

def ping_sweep(network_cidr, threads=100):
    """Ping every host in network_cidr and return list of live IPs."""
    net = ipaddress.ip_network(network_cidr, strict=False)
    hosts = [str(h) for h in net.hosts()]
    live = []
    lock = threading.Lock()

    def worker(ip):
        if ping(ip):
            with lock:
                live.append(ip)

    print(f"[+] Running ping sweep on {network_cidr} (this may take a while)...")
    thread_pool = []
    for ip in hosts:
        while threading.active_count() > threads:
            time.sleep(0.01)
        t = threading.Thread(target=worker, args=(ip,))
        t.daemon = True
        t.start()
        thread_pool.append(t)
    for t in thread_pool:
        t.join()
    return [{"ip": ip, "mac": None} for ip in live]

def get_mac_from_arp_table(ip):
    """Try to get MAC for an IP from the local ARP table (platform dependent)."""
    try:
        if platform.system().lower() == "windows":
            out = subprocess.check_output(["arp", "-a"], universal_newlines=True)
            for line in out.splitlines():
                if ip in line:
                    parts = line.split()
                    # windows format: Interface: ...; Internet Address, Physical Address, Type
                    for p in parts:
                        if p.count(":") == 5 or p.count("-") == 5:
                            return p.replace("-", ":")
        else:
            out = subprocess.check_output(["ip", "neigh"], universal_newlines=True, stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                if line.startswith(ip):
                    # format: 192.168.1.1 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE
                    parts = line.split()
                    if "lladdr" in parts:
                        idx = parts.index("lladdr")
                        return parts[idx+1]
    except Exception:
        pass
    return None

def reverse_dns(ip):
    try:
        name = socket.gethostbyaddr(ip)[0]
        return name
    except Exception:
        return ""

def run_nmap_scan(ip):
    """Run nmap scan using either python-nmap or nmap binary. Returns dict."""
    nm_result = {}
    if shutil.which("nmap") is None:
        print("[!] nmap binary not found on PATH; skipping nmap scan")
        return nm_result
    print(f"[+] Running nmap scan on {ip} (ports: {NMAP_PORTS})")
    if HAVE_PY_NMAP:
        nm = nmap.PortScanner()
        try:
            nm.scan(ip, arguments=f"-sS -sV -p {NMAP_PORTS} --open -O --host-timeout 60s")
            if ip in nm.all_hosts():
                host = nm[ip]
                nm_result["nmap"] = host
        except Exception as e:
            print("[!] python-nmap error:", e)
    else:
        # fallback to subprocess
        try:
            cmd = ["nmap", "-sS", "-sV", "-p", NMAP_PORTS, "--open", "-O", "-oX", "-", ip]
            out = subprocess.check_output(cmd, universal_newlines=True, stderr=subprocess.DEVNULL, timeout=120)
            nm_result["raw_nmap_xml"] = out
        except Exception as e:
            print("[!] nmap subprocess error:", e)
    return nm_result

def try_ssh_collect(ip, username, password, timeout=8):
    """If paramiko exists and credentials valid, attempt a few commands to collect info."""
    if not HAVE_PARAMIKO:
        return {"error": "paramiko not installed"}
    info = {}
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=username, password=password, timeout=timeout, look_for_keys=False, allow_agent=False)
        for cmd in ["uname -a", "cat /etc/os-release || true", "whoami", "uptime"]:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
            out = stdout.read().decode(errors="ignore").strip()
            info[cmd] = out
        client.close()
    except Exception as e:
        info["error"] = str(e)
    return info

def try_snmp_get(ip, community="public", oid="1.3.6.1.2.1.1.1.0"):  # sysDescr
    """Attempt a single SNMP GET for sysDescr (requires pysnmp)."""
    if not HAVE_PYSNMP:
        return {"error": "pysnmp not installed"}
    try:
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(community, mpModel=0),
            UdpTransportTarget((ip, 161), timeout=1, retries=0),
            ContextData(),
            ObjectType(ObjectIdentity(oid)),
        )
        error_indication, error_status, error_index, var_binds = next(iterator)
        if error_indication:
            return {"error": str(error_indication)}
        elif error_status:
            return {"error": f"{error_status.prettyPrint()}"}
        else:
            res = {str(x[0]): str(x[1]) for x in var_binds}
            return res
    except Exception as e:
        return {"error": str(e)}

def main():
    print("[*] LAN discovery started")
    local_ip = get_local_ip()
    print("[*] Local IP detected:", local_ip)
    network = guess_subnet_cidr(local_ip)
    print("[*] Using network:", network)

    # 1) Host discovery
    hosts = []
    try:
        if HAVE_SCAPY:
            arp_results = arp_scan_scapy(network)
            for r in arp_results:
                hosts.append({"ip": r["ip"], "mac": r.get("mac")})
        else:
            print("[!] scapy not available - falling back to ping sweep")
            hosts = ping_sweep(network)
    except Exception as e:
        print("[!] ARP scan failed:", e)
        print("[!] Falling back to ping sweep")
        hosts = ping_sweep(network)

    # Deduplicate and enrich host list
    unique = {}
    for h in hosts:
        ip = h["ip"]
        if ip not in unique:
            unique[ip] = {"ip": ip, "mac": h.get("mac")}
    # also try to add IPs from ARP table (if any)
    try:
        # parse common arp entries by reading 'arp -a' or 'ip neigh' lines
        if platform.system().lower() == "windows":
            out = subprocess.check_output(["arp", "-a"], universal_newlines=True)
            for line in out.splitlines():
                parts = line.split()
                if len(parts) >= 2 and parts[0].count(".") == 3:
                    ip = parts[0]
                    mac = None
                    for p in parts:
                        if p.count("-") == 5 or p.count(":") == 5:
                            mac = p.replace("-", ":")
                    if ip not in unique:
                        unique[ip] = {"ip": ip, "mac": mac}
        else:
            out = subprocess.check_output(["ip", "neigh"], universal_newlines=True, stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                parts = line.split()
                if len(parts) >= 1:
                    ip = parts[0]
                    mac = None
                    if "lladdr" in parts:
                        mac = parts[parts.index("lladdr")+1]
                    if ip not in unique:
                        unique[ip] = {"ip": ip, "mac": mac}
    except Exception:
        pass

    host_entries = []
    for ip, info in unique.items():
        if ip in ("127.0.0.1", local_ip):
            continue
        mac = info.get("mac") or get_mac_from_arp_table(ip)
        hostname = reverse_dns(ip)
        entry = {
            "ip": ip,
            "hostname": hostname,
            "mac": mac or "",
            "nmap": None,
            "ssh_info": None,
            "snmp_info": None
        }
        # optionally run nmap (if allowed)
        if RUN_NMAP:
            entry["nmap"] = run_nmap_scan(ip)
        host_entries.append(entry)

    # Attempt SSH collection for listed credentials (if any)
    if SSH_CREDENTIALS and HAVE_PARAMIKO:
        for cred in SSH_CREDENTIALS:
            ip = cred.get("host")
            username = cred.get("username")
            password = cred.get("password")
            for e in host_entries:
                if e["ip"] == ip:
                    e["ssh_info"] = try_ssh_collect(ip, username, password)

    # Attempt SNMP collection using common community strings
    if HAVE_PYSNMP and SNMP_COMMUNITIES:
        for e in host_entries:
            for comm in SNMP_COMMUNITIES:
                res = try_snmp_get(e["ip"], community=comm)
                if res and "error" not in res:
                    e["snmp_info"] = {"community": comm, "sysDescr": res}
                    break

    # Write CSV summary
    csv_file = "lan_discovery_results.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ip", "hostname", "mac", "nmap_summary", "ssh_info", "snmp_info"])
        for e in host_entries:
            nm = ""
            if e["nmap"]:
                if "nmap" in e["nmap"] and isinstance(e["nmap"]["nmap"], dict):
                    nm = str(e["nmap"]["nmap"].get("status", {}))
                else:
                    nm = "nmap_raw" if "raw_nmap_xml" in e["nmap"] else ""
            writer.writerow([e["ip"], e["hostname"], e["mac"], nm, str(e["ssh_info"] or ""), str(e["snmp_info"] or "")])

    print(f"[*] Discovery complete — results saved to {csv_file}")
    for e in host_entries:
        print("----")
        print("IP:", e["ip"])
        print("Hostname:", e["hostname"])
        print("MAC:", e["mac"])
        if e["nmap"]:
            print("Nmap: available (see CSV for details or enable parse)")
        if e["ssh_info"]:
            print("SSH info: yes")
        if e["snmp_info"]:
            print("SNMP info: yes")
    print("[*] Done.")

if __name__ == "__main__":
    main()