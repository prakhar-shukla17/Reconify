# ITAM Scanner Service Script
# This script runs the ITAM scanner in the background as a Windows service-like process

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Install
)

$ScriptName = "ITAM Scanner Service"
$ProcessName = "pythonw"
$ScriptPath = Join-Path $PSScriptRoot "itam_scanner.py"
$LogPath = Join-Path $PSScriptRoot "logs"
$PIDFile = Join-Path $PSScriptRoot "itam_scanner.pid"

# Create logs directory if it doesn't exist
if (!(Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
    Add-Content -Path (Join-Path $LogPath "service.log") -Value "[$timestamp] $Message"
}

function Get-ITAMProcess {
    # Find ITAM scanner processes
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*itam_scanner*" -or 
        (Get-WmiObject -Class Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*itam_scanner*"
    }
    return $processes
}

function Start-ITAMService {
    Write-Log "Starting $ScriptName..."
    
    # Check if already running
    $existingProcesses = Get-ITAMProcess
    if ($existingProcesses) {
        Write-Log "ITAM Scanner is already running (PID: $($existingProcesses.Id -join ', '))"
        return
    }
    
    # Check if Python is installed
    try {
        $pythonVersion = python --version 2>&1
        Write-Log "Python version: $pythonVersion"
    }
    catch {
        Write-Log "Error: Python is not installed or not in PATH"
        return
    }
    
    # Install dependencies
    Write-Log "Installing/checking dependencies..."
    pip install -r requirements.txt 2>&1 | Out-Null
    
    # Start the scanner in background
    Write-Log "Starting ITAM Scanner process..."
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "pythonw"
    $startInfo.Arguments = "`"$ScriptPath`""
    $startInfo.WorkingDirectory = $PSScriptRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    $process.Start() | Out-Null
    
    # Save PID to file
    $process.Id | Out-File -FilePath $PIDFile -Encoding ASCII
    
    # Wait a moment and check if it started successfully
    Start-Sleep -Seconds 3
    $runningProcesses = Get-ITAMProcess
    
    if ($runningProcesses) {
        Write-Log "ITAM Scanner started successfully (PID: $($process.Id))"
        Write-Log "The scanner is now running in the background"
        Write-Log "You can close this window - the scanner will continue running"
    } else {
        Write-Log "Failed to start ITAM Scanner"
        if (Test-Path $PIDFile) { Remove-Item $PIDFile }
    }
}

function Stop-ITAMService {
    Write-Log "Stopping $ScriptName..."
    
    # Get running processes
    $processes = Get-ITAMProcess
    
    if (!$processes) {
        Write-Log "No ITAM Scanner processes found"
        if (Test-Path $PIDFile) { Remove-Item $PIDFile }
        return
    }
    
    # Stop each process
    foreach ($process in $processes) {
        Write-Log "Stopping process PID: $($process.Id)"
        try {
            $process.Kill()
            $process.WaitForExit(5000)
            Write-Log "Process $($process.Id) stopped successfully"
        }
        catch {
            Write-Log "Failed to stop process $($process.Id): $($_.Exception.Message)"
        }
    }
    
    # Remove PID file
    if (Test-Path $PIDFile) { Remove-Item $PIDFile }
    
    Write-Log "ITAM Scanner stopped"
}

function Get-ITAMStatus {
    Write-Log "Checking $ScriptName status..."
    
    $processes = Get-ITAMProcess
    
    if ($processes) {
        Write-Log "ITAM Scanner is RUNNING"
        foreach ($process in $processes) {
            Write-Log "  Process ID: $($process.Id)"
            Write-Log "  Start Time: $($process.StartTime)"
            Write-Log "  Memory Usage: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB"
        }
    } else {
        Write-Log "ITAM Scanner is NOT RUNNING"
    }
    
    # Check PID file
    if (Test-Path $PIDFile) {
        $storedPID = Get-Content $PIDFile
        Write-Log "Stored PID: $storedPID"
    }
}

# Main execution
if ($Start) {
    Start-ITAMService
}
elseif ($Stop) {
    Stop-ITAMService
}
elseif ($Status) {
    Get-ITAMStatus
}
elseif ($Install) {
    Write-Log "Creating scheduled task for ITAM Scanner..."
    # This would create a Windows scheduled task for auto-start
    Write-Log "Installation feature not implemented yet"
}
else {
    # Default: show help
    Write-Host "ITAM Scanner Service Management"
    Write-Host "Usage: .\run_itam_scanner_service.ps1 [-Start] [-Stop] [-Status] [-Install]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Start    Start the ITAM Scanner service"
    Write-Host "  -Stop     Stop the ITAM Scanner service"
    Write-Host "  -Status   Check the status of the ITAM Scanner service"
    Write-Host "  -Install  Install as a Windows service (not implemented)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run_itam_scanner_service.ps1 -Start"
    Write-Host "  .\run_itam_scanner_service.ps1 -Status"
    Write-Host "  .\run_itam_scanner_service.ps1 -Stop"
}
