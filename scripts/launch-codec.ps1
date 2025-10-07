# ChatLaLiLuLeLo MGS2 Codec Launcher
# Automated launcher with dependency checking and browser launch
param(
    [switch]$SkipBrowser,
    [switch]$Verbose
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AppUrl = "http://localhost:3000"
$ApiUrl = "http://localhost:8787"
$MaxStartupWait = 60  # seconds
$ProcessCheckInterval = 2  # seconds

# Console colors for MGS2 theme
$Colors = @{
    Primary = "Cyan"
    Secondary = "Green" 
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
}

function Write-CodecMessage {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = $Colors[$Type]
    
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor $color
    
    if ($Verbose) {
        Write-Host ""
    }
}

function Test-Dependency {
    param(
        [string]$Command,
        [string]$Name,
        [string]$InstallInstructions = ""
    )
    
    Write-CodecMessage "Checking $Name..." -Type "Info"
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-CodecMessage "✓ $Name found" -Type "Secondary"
        return $true
    }
    catch {
        Write-CodecMessage "✗ $Name not found" -Type "Error"
        if ($InstallInstructions) {
            Write-CodecMessage "Install with: $InstallInstructions" -Type "Warning"
        }
        return $false
    }
}

function Wait-ForServer {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 30
    )
    
    Write-CodecMessage "Waiting for $Name server at $Url..." -Type "Info"
    
    $startTime = Get-Date
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    do {
        try {
            $response = Invoke-WebRequest -Uri "$Url/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $elapsed = ((Get-Date) - $startTime).TotalSeconds
                Write-CodecMessage "✓ $Name server ready (${elapsed}s)" -Type "Secondary"
                return $true
            }
        }
        catch {
            # Server not ready yet, continue waiting
        }
        
        Start-Sleep -Seconds $ProcessCheckInterval
    } while ((Get-Date) -lt $timeout)
    
    Write-CodecMessage "✗ $Name server failed to start within ${TimeoutSeconds}s" -Type "Error"
    return $false
}

function Start-DevServers {
    Write-CodecMessage "Starting development servers..." -Type "Primary"
    
    try {
        # Change to project directory
        Push-Location $ProjectRoot
        
        # Start the development servers using npm run dev
        $devProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Minimized
        
        if (-not $devProcess) {
            throw "Failed to start development servers"
        }
        
        Write-CodecMessage "Development servers started (PID: $($devProcess.Id))" -Type "Secondary"
        
        # Wait for both servers to be ready
        $frontendReady = Wait-ForServer -Url $AppUrl -Name "Frontend" -TimeoutSeconds 45
        $backendReady = Wait-ForServer -Url $ApiUrl -Name "API" -TimeoutSeconds 30
        
        if (-not ($frontendReady -and $backendReady)) {
            Write-CodecMessage "Not all servers started successfully" -Type "Error"
            return $false
        }
        
        return $devProcess
    }
    catch {
        Write-CodecMessage "Failed to start servers: $($_.Exception.Message)" -Type "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Open-Browser {
    param([string]$Url)
    
    if ($SkipBrowser) {
        Write-CodecMessage "Skipping browser launch (--SkipBrowser specified)" -Type "Warning"
        return
    }
    
    Write-CodecMessage "Opening codec interface in browser..." -Type "Info"
    
    try {
        Start-Process $Url
        Write-CodecMessage "✓ Browser launched" -Type "Secondary"
    }
    catch {
        Write-CodecMessage "Failed to launch browser: $($_.Exception.Message)" -Type "Warning"
        Write-CodecMessage "Please manually navigate to: $Url" -Type "Info"
    }
}

function Show-LauncherInfo {
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage "    MGS2 CODEC COMMUNICATION SYSTEM      " -Type "Primary"
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage ""
    Write-CodecMessage "Frontend: $AppUrl" -Type "Info"
    Write-CodecMessage "API:      $ApiUrl" -Type "Info"
    Write-CodecMessage ""
    Write-CodecMessage "Press Ctrl+C to terminate all servers" -Type "Warning"
    Write-CodecMessage ""
}

function Cleanup {
    Write-CodecMessage "Shutting down codec system..." -Type "Warning"
    
    # Kill any running npm processes related to our project
    Get-Process | Where-Object { 
        $_.ProcessName -eq "node" -or 
        $_.ProcessName -eq "npm" 
    } | ForEach-Object {
        try {
            if ($_.MainWindowTitle -like "*ChatLaLiLuLeLo*" -or 
                $_.CommandLine -like "*$ProjectRoot*") {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            # Process may have already exited
        }
    }
    
    Write-CodecMessage "Codec system terminated" -Type "Info"
}

# Main execution
try {
    Show-LauncherInfo
    
    # Dependency checks
    Write-CodecMessage "Performing system checks..." -Type "Primary"
    
    $nodeOk = Test-Dependency -Command "node" -Name "Node.js" -InstallInstructions "Download from https://nodejs.org/"
    $npmOk = Test-Dependency -Command "npm" -Name "npm" -InstallInstructions "Included with Node.js"
    
    if (-not ($nodeOk -and $npmOk)) {
        Write-CodecMessage "Missing required dependencies. Please install and try again." -Type "Error"
        exit 1
    }
    
    # Check project structure
    if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
        Write-CodecMessage "Project package.json not found. Please run from correct directory." -Type "Error"
        exit 1
    }
    
    Write-CodecMessage "All dependencies verified" -Type "Secondary"
    Write-CodecMessage ""
    
    # Start servers
    $devProcess = Start-DevServers
    
    if (-not $devProcess) {
        Write-CodecMessage "Failed to start development environment" -Type "Error"
        exit 1
    }
    
    # Launch browser
    Open-Browser -Url $AppUrl
    
    # Keep running and monitor
    Show-LauncherInfo
    Write-CodecMessage "Codec system online and ready" -Type "Primary"
    
    # Register cleanup handler
    Register-EngineEvent -SourceIdentifier "ConsoleBreak" -Action {
        Cleanup
    }
    
    # Wait for user input or process termination
    try {
        while ($devProcess -and -not $devProcess.HasExited) {
            Start-Sleep -Seconds 5
            
            # Check if servers are still responding
            try {
                $null = Invoke-WebRequest -Uri "$AppUrl" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            }
            catch {
                Write-CodecMessage "Frontend server appears to have stopped" -Type "Warning"
                break
            }
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        # User pressed Ctrl+C
    }
}
catch {
    Write-CodecMessage "Launcher error: $($_.Exception.Message)" -Type "Error"
    exit 1
}
finally {
    Cleanup
}
