# ChatLaLiLuLeLo Simple Launcher Test
param(
    [switch]$SkipBrowser
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AppUrl = "http://localhost:3000"

# Console colors
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
}

function Test-Dependency {
    param(
        [string]$Command,
        [string]$Name
    )
    
    Write-CodecMessage "Checking $Name..." -Type "Info"
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-CodecMessage "✓ $Name found" -Type "Secondary"
        return $true
    }
    catch {
        Write-CodecMessage "✗ $Name not found" -Type "Error"
        return $false
    }
}

# Main execution
Write-CodecMessage "===========================================" -Type "Primary"
Write-CodecMessage "    MGS2 CODEC COMMUNICATION SYSTEM      " -Type "Primary"
Write-CodecMessage "===========================================" -Type "Primary"
Write-CodecMessage ""

Write-CodecMessage "Performing system checks..." -Type "Primary"

$nodeOk = Test-Dependency -Command "node" -Name "Node.js"
$npmOk = Test-Dependency -Command "npm" -Name "npm"

if ($nodeOk -and $npmOk) {
    Write-CodecMessage "All dependencies verified ✓" -Type "Secondary"
    
    # Check project structure
    if (Test-Path (Join-Path $ProjectRoot "package.json")) {
        Write-CodecMessage "Project structure verified ✓" -Type "Secondary"
        Write-CodecMessage ""
        Write-CodecMessage "Ready to start development servers!" -Type "Primary"
        Write-CodecMessage "Frontend would start at: $AppUrl" -Type "Info"
        
        if (-not $SkipBrowser) {
            Write-CodecMessage "Would launch browser..." -Type "Info"
        } else {
            Write-CodecMessage "Skipping browser launch" -Type "Warning"
        }
    } else {
        Write-CodecMessage "✗ Project package.json not found" -Type "Error"
        exit 1
    }
} else {
    Write-CodecMessage "Missing required dependencies" -Type "Error"
    exit 1
}
