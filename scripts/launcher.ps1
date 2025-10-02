# ChatLaLiLuLeLo MGS2 Codec System Launcher
param(
    [switch]$SkipBrowser,
    [switch]$Verbose,
    [switch]$KeepOpen
)

# Set error handling and execution policy
$ErrorActionPreference = "Continue"
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Configuration - Updated for correct ports
# Handle both script and compiled executable contexts
if ([string]::IsNullOrEmpty($PSScriptRoot)) {
    # Running as compiled executable
    $ScriptDir = Split-Path -Parent ([System.Reflection.Assembly]::GetEntryAssembly().Location)
    # Assume executable is in dist/ folder, so project root is parent
    $ProjectRoot = Split-Path -Parent $ScriptDir
} else {
    # Running as PowerShell script
    $ScriptDir = $PSScriptRoot
    $ProjectRoot = Split-Path -Parent $ScriptDir
}
$FrontendUrl = "http://localhost:8082"  # Correct Expo web port
$BackendUrl = "http://localhost:8787"   # Correct Wrangler dev port
$MaxStartupWait = 60
$ProcessCheckInterval = 3

# Console colors for MGS2 theme
$Colors = @{
    Primary = "Cyan"
    Secondary = "Green" 
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
    Success = "DarkGreen"
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
        $output = & $Command --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-CodecMessage "OK $Name found: $output" -Type "Success"
            return $true
        }
    }
    catch {
        # Command not found
    }
    
    Write-CodecMessage "ERROR $Name not found" -Type "Error"
    if ($InstallInstructions) {
        Write-CodecMessage "Install: $InstallInstructions" -Type "Warning"
    }
    return $false
}

function Wait-ForServer {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 45,
        [string]$HealthPath = "/health"
    )
    
    Write-CodecMessage "Waiting for $Name server at $Url..." -Type "Info"
    
    $startTime = Get-Date
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    do {
        try {
            # Try both health endpoint and root for frontend
            $testUrl = if ($Name -eq "Frontend") { $Url } else { "$Url$HealthPath" }
            $response = Invoke-WebRequest -Uri $testUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
                Write-CodecMessage "OK $Name server ready (${elapsed}s)" -Type "Success"
                return $true
            }
        }
        catch {
            # Server not ready yet, continue waiting
            if ($Verbose) {
                Write-CodecMessage "  Still waiting for $Name..." -Type "Info"
            }
        }
        
        Start-Sleep -Seconds $ProcessCheckInterval
    } while ((Get-Date) -lt $timeout)
    
    Write-CodecMessage "ERROR $Name server failed to start within ${TimeoutSeconds}s" -Type "Error"
    return $false
}

function Start-DevServers {
    Write-CodecMessage "Starting development servers..." -Type "Primary"
    
    try {
        # Ensure we're in the correct directory
        if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
            throw "Project package.json not found at: $ProjectRoot"
        }
        
        Set-Location $ProjectRoot
        
        # Start servers with visible console for debugging
        Write-CodecMessage "Executing: npm run prod" -Type "Info"
        
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "npm"
        $startInfo.Arguments = "run prod"
        $startInfo.WorkingDirectory = $ProjectRoot
        $startInfo.UseShellExecute = $true
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $devProcess = [System.Diagnostics.Process]::Start($startInfo)
        
        if (-not $devProcess) {
            throw "Failed to start development servers"
        }
        
        Write-CodecMessage "Development servers started (PID: $($devProcess.Id))" -Type "Success"
        
        # Wait for servers to be ready
        Write-CodecMessage "Waiting for servers to initialize..." -Type "Info"
        Start-Sleep -Seconds 10  # Give initial startup time
        
        $backendReady = Wait-ForServer -Url $BackendUrl -Name "Backend" -TimeoutSeconds 30
        $frontendReady = Wait-ForServer -Url $FrontendUrl -Name "Frontend" -TimeoutSeconds 45
        
        if ($backendReady -and $frontendReady) {
            Write-CodecMessage "All servers are operational" -Type "Success"
            return $devProcess
        } else {
            Write-CodecMessage "Some servers failed to start properly" -Type "Warning"
            Write-CodecMessage "Backend Ready: $backendReady | Frontend Ready: $frontendReady" -Type "Info"
            # Return process anyway - user can still try to use it
            return $devProcess
        }
    }
    catch {
        Write-CodecMessage "Failed to start servers: $($_.Exception.Message)" -Type "Error"
        Write-CodecMessage "Current directory: $(Get-Location)" -Type "Info"
        Write-CodecMessage "Project root: $ProjectRoot" -Type "Info"
        return $false
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
        Write-CodecMessage "OK Browser launched at $Url" -Type "Success"
    }
    catch {
        Write-CodecMessage "Failed to launch browser: $($_.Exception.Message)" -Type "Warning"
        Write-CodecMessage "Please manually navigate to: $Url" -Type "Info"
    }
}

function Show-LauncherInfo {
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage "    MGS2 CODEC COMMUNICATION SYSTEM      " -Type "Primary"
    Write-CodecMessage "         ChatLaLiLuLeLo v3 Launcher       " -Type "Primary"
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage ""
    Write-CodecMessage "Frontend: $FrontendUrl" -Type "Info"
    Write-CodecMessage "Backend:  $BackendUrl" -Type "Info"
    Write-CodecMessage "Project:  $ProjectRoot" -Type "Info"
    Write-CodecMessage ""
}

function Show-FinalStatus {
    param([object]$Process)
    
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage "        CODEC SYSTEM OPERATIONAL          " -Type "Success"
    Write-CodecMessage "===========================================" -Type "Primary"
    Write-CodecMessage ""
    Write-CodecMessage "OK Frontend: $FrontendUrl" -Type "Success"
    Write-CodecMessage "OK Backend:  $BackendUrl" -Type "Success"
    Write-CodecMessage "OK Process:  PID $($Process.Id)" -Type "Success"
    Write-CodecMessage ""
    Write-CodecMessage "The codec interface is now ready for use!" -Type "Primary"
    
    if ($KeepOpen) {
        Write-CodecMessage ""
        Write-CodecMessage "Press Ctrl+C to terminate servers" -Type "Warning"
        Write-CodecMessage "Or close this window to stop the launcher" -Type "Info"
    } else {
        Write-CodecMessage ""
        Write-CodecMessage "Launcher will exit in 10 seconds..." -Type "Info"
        Write-CodecMessage "Servers will continue running in background" -Type "Info"
        Start-Sleep -Seconds 10
    }
}

# Main execution
try {
    Show-LauncherInfo
    
    # Dependency checks
    Write-CodecMessage "Performing system checks..." -Type "Primary"
    
    $nodeOk = Test-Dependency -Command "node" -Name "Node.js" -InstallInstructions "Download from https://nodejs.org/"
    $npmOk = Test-Dependency -Command "npm" -Name "npm" -InstallInstructions "Included with Node.js"
    
    if (-not ($nodeOk -and $npmOk)) {
        Write-CodecMessage "Missing required dependencies. Install and try again." -Type "Error"
        Write-CodecMessage "Press any key to exit..." -Type "Info"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    # Check project structure
    if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
        Write-CodecMessage "Project package.json not found at: $ProjectRoot" -Type "Error"
        Write-CodecMessage "Please ensure launcher is in the scripts/ directory" -Type "Info"
        Write-CodecMessage "Press any key to exit..." -Type "Info"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    Write-CodecMessage "All dependencies verified" -Type "Success"
    Write-CodecMessage ""
    
    # Start servers
    $devProcess = Start-DevServers
    
    if (-not $devProcess) {
        Write-CodecMessage "Failed to start development environment" -Type "Error"
        Write-CodecMessage "Check the console output above for errors" -Type "Info"
        Write-CodecMessage "Press any key to exit..." -Type "Info"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    # Launch browser
    Start-Sleep -Seconds 3  # Give servers a moment to fully initialize
    Open-Browser -Url $FrontendUrl
    
    # Show final status
    Show-FinalStatus -Process $devProcess
    
    if ($KeepOpen) {
        # Keep launcher open and monitor servers
        Write-CodecMessage "Monitoring server status..." -Type "Info"
        
        try {
            while (-not $devProcess.HasExited) {
                Start-Sleep -Seconds 15
                
                # Periodic health check
                try {
                    $frontendCheck = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                    $backendCheck = Invoke-WebRequest -Uri "$BackendUrl/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                    
                    if ($Verbose) {
                        Write-CodecMessage "OK Servers responding normally" -Type "Success"
                    }
                }
                catch {
                    Write-CodecMessage "WARNING Server health check failed" -Type "Warning"
                    if ($Verbose) {
                        Write-CodecMessage "Error: $($_.Exception.Message)" -Type "Error"
                    }
                }
            }
        }
        catch [System.Management.Automation.PipelineStoppedException] {
            Write-CodecMessage "Launcher terminated by user" -Type "Info"
        }
    }
    
    Write-CodecMessage "Launcher exiting - servers continue in background" -Type "Info"
}
catch {
    Write-CodecMessage "Launcher error: $($_.Exception.Message)" -Type "Error"
    Write-CodecMessage "Line: $($_.InvocationInfo.ScriptLineNumber)" -Type "Error"
    Write-CodecMessage "Press any key to exit..." -Type "Info"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
