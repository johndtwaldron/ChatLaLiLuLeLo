# Test-Lightning.ps1
# PowerShell script for Lightning Network validation on Windows
# Compatible with both Windows PowerShell 5.1 and PowerShell Core 7.x

param(
    [switch]$Verbose = $false,
    [switch]$Fix = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host @"
Test-Lightning.ps1 - Lightning Network Validation for Windows

SYNOPSIS:
    Validates Lightning Network components locally before pushing to CI

SYNTAX:
    .\scripts\Test-Lightning.ps1 [-Verbose] [-Fix] [-Help]

PARAMETERS:
    -Verbose    Show detailed output
    -Fix        Attempt to fix common issues automatically
    -Help       Show this help message

DESCRIPTION:
    This script validates Lightning Network components in your local Windows
    environment to catch issues before CI runs. It checks:
    
    • Required Lightning files exist
    • Test utilities are functional
    • Dependencies are properly configured
    • Environment compatibility with CI

EXAMPLES:
    .\scripts\Test-Lightning.ps1
        Run basic validation
        
    .\scripts\Test-Lightning.ps1 -Verbose
        Run with detailed output
        
    .\scripts\Test-Lightning.ps1 -Verbose -Fix
        Run with detailed output and attempt to fix issues

EXIT CODES:
    0 - All validations passed
    1 - Some validations failed
    2 - Critical error occurred

NOTES:
    This script mimics the CI validation locally to help catch issues early.
    Run this before committing Lightning-related changes.
"@
    exit 0
}

# Colors for output
$Colors = @{
    Green = "Green"
    Red = "Red"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

# Results tracking
$Results = @{
    Passed = @()
    Failed = @()
    Warnings = @()
    Fixed = @()
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-CheckPassed {
    param([string]$Message, [string]$Details = "")
    
    $Results.Passed += @{ Message = $Message; Details = $Details }
    Write-ColorOutput "✅ $Message" -Color $Colors.Green
    
    if ($Details -and $Verbose) {
        Write-ColorOutput "   $Details" -Color $Colors.Cyan
    }
}

function Write-CheckFailed {
    param([string]$Message, [string]$Details = "", [bool]$Fixable = $false)
    
    $Results.Failed += @{ Message = $Message; Details = $Details; Fixable = $Fixable }
    Write-ColorOutput "❌ $Message" -Color $Colors.Red
    
    if ($Details -and $Verbose) {
        Write-ColorOutput "   Details: $Details" -Color $Colors.Cyan
    }
    
    if ($Fixable -and $Verbose) {
        Write-ColorOutput "   Fix available: run with -Fix flag" -Color $Colors.Cyan
    }
}

function Write-CheckWarning {
    param([string]$Message, [string]$Details = "")
    
    $Results.Warnings += @{ Message = $Message; Details = $Details }
    Write-ColorOutput "⚠️ $Message" -Color $Colors.Yellow
    
    if ($Details -and $Verbose) {
        Write-ColorOutput "   $Details" -Color $Colors.Cyan
    }
}

function Write-CheckFixed {
    param([string]$Message, [string]$Details = "")
    
    $Results.Fixed += @{ Message = $Message; Details = $Details }
    Write-ColorOutput "🔧 Fixed: $Message" -Color $Colors.Green
    
    if ($Details -and $Verbose) {
        Write-ColorOutput "   $Details" -Color $Colors.Cyan
    }
}

function Test-Environment {
    Write-ColorOutput "`n🌍 Checking environment..." -Color $Colors.Blue
    
    # PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    Write-CheckPassed "PowerShell version: $psVersion"
    
    # Operating system
    $os = if ($IsWindows -or $env:OS -eq "Windows_NT") { "Windows" } else { "Non-Windows" }
    Write-CheckPassed "Operating System: $os"
    
    # Node.js version check
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-CheckPassed "Node.js version: $nodeVersion"
        } else {
            Write-CheckFailed "Node.js not found in PATH" "Required for running JavaScript tests"
        }
    } catch {
        Write-CheckFailed "Node.js not available" $_.Exception.Message
    }
    
    # Working directory
    $cwd = Get-Location
    Write-CheckPassed "Working directory: $cwd"
    
    # Check if in project root
    if (Test-Path "package.json") {
        Write-CheckPassed "Project root detected (package.json found)"
    } else {
        Write-CheckWarning "Not in project root (no package.json found)"
    }
}

function Test-LightningFiles {
    Write-ColorOutput "`n🔍 Checking required Lightning files..." -Color $Colors.Blue
    
    $requiredFiles = @(
        @{ Path = "apps\mobile\src\lib\bitcoin.ts"; Description = "Bitcoin utilities library" }
        @{ Path = "apps\mobile\src\lib\lightning.ts"; Description = "Lightning Network utilities library" }
        @{ Path = "apps\mobile\src\config\lightning.ts"; Description = "Lightning Network configuration" }
        @{ Path = "tests\utils\lightning-test-utils.js"; Description = "Lightning Network test utilities" }
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file.Path) {
            $size = (Get-Item $file.Path).Length
            Write-CheckPassed "$($file.Description) exists" "$($file.Path) ($size bytes)"
            
            # Check if file is empty
            if ($size -eq 0) {
                Write-CheckWarning "$($file.Description) is empty" $file.Path
            }
        } else {
            Write-CheckFailed "$($file.Description) missing" $file.Path $true
            
            if ($Fix) {
                Write-ColorOutput "   Attempting to create missing file..." -Color $Colors.Yellow
                # Note: File creation templates would be implemented here
                # For now, just show what would be done
                Write-CheckWarning "File creation not implemented in PowerShell version" "Use Node.js diagnostic script with --fix"
            }
        }
    }
}

function Test-Dependencies {
    Write-ColorOutput "`n📦 Checking dependencies..." -Color $Colors.Blue
    
    $packageFiles = @("package.json", "apps\mobile\package.json", "apps\edge\package.json")
    
    foreach ($packageFile in $packageFiles) {
        if (Test-Path $packageFile) {
            try {
                $pkg = Get-Content $packageFile -Raw | ConvertFrom-Json
                Write-CheckPassed "$packageFile found"
                
                if ($Verbose) {
                    Write-ColorOutput "   Name: $($pkg.name), Version: $($pkg.version)" -Color $Colors.Cyan
                }
                
                # Check for Lightning-related dependencies
                $allDeps = @()
                if ($pkg.dependencies) { $allDeps += $pkg.dependencies.PSObject.Properties.Name }
                if ($pkg.devDependencies) { $allDeps += $pkg.devDependencies.PSObject.Properties.Name }
                
                $lightningDeps = $allDeps | Where-Object { $_ -match "(qr|bitcoin|lightning)" }
                if ($lightningDeps -and $Verbose) {
                    Write-ColorOutput "   Lightning-related deps: $($lightningDeps -join ', ')" -Color $Colors.Cyan
                }
            } catch {
                Write-CheckFailed "Invalid JSON in $packageFile" $_.Exception.Message
            }
        } else {
            Write-CheckWarning "$packageFile not found"
        }
    }
}

function Test-TestStructure {
    Write-ColorOutput "`n🧪 Checking test structure..." -Color $Colors.Blue
    
    $testDirs = @("tests", "tests\utils", "tests\e2e-web", "scripts")
    
    foreach ($dir in $testDirs) {
        if (Test-Path $dir -PathType Container) {
            Write-CheckPassed "$dir directory exists"
            
            if ($Verbose) {
                $files = Get-ChildItem $dir -Name | Select-Object -First 5
                if ($files) {
                    Write-ColorOutput "   Files: $($files -join ', ')$(if ((Get-ChildItem $dir).Count -gt 5) { '...' })" -Color $Colors.Cyan
                }
            }
        } else {
            Write-CheckFailed "$dir directory missing" "" $true
            
            if ($Fix) {
                try {
                    New-Item -Path $dir -ItemType Directory -Force | Out-Null
                    Write-CheckFixed "Created $dir directory"
                } catch {
                    Write-ColorOutput "   Failed to create $dir`: $($_.Exception.Message)" -Color $Colors.Red
                }
            }
        }
    }
    
    # Check for specific test files
    $testFiles = @(
        "tests\e2e-web\lightning-qr.spec.ts",
        "scripts\test-lightning-e2e.js",
        "scripts\test-lightning-fixes.js"
    )
    
    foreach ($file in $testFiles) {
        if (Test-Path $file) {
            Write-CheckPassed "$file exists"
        } else {
            Write-CheckWarning "$file not found (may be created later)"
        }
    }
}

function Test-LightningValidation {
    Write-ColorOutput "`n⚡ Running Lightning validation tests..." -Color $Colors.Blue
    
    try {
        if (Test-Path "tests\utils\lightning-test-utils.js") {
            $result = node "tests\utils\lightning-test-utils.js" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-CheckPassed "Lightning validation tests passed"
                if ($Verbose) {
                    Write-ColorOutput "   $($result -join "`n   ")" -Color $Colors.Cyan
                }
            } else {
                Write-CheckFailed "Lightning validation tests failed" "Exit code: $LASTEXITCODE"
                if ($Verbose) {
                    Write-ColorOutput "   $($result -join "`n   ")" -Color $Colors.Red
                }
            }
        } else {
            Write-CheckWarning "Lightning test utilities not available for validation"
        }
    } catch {
        Write-CheckFailed "Lightning validation test failed" $_.Exception.Message
    }
}

function Write-Report {
    Write-ColorOutput "`n📊 Diagnostic Summary" -Color $Colors.White
    Write-ColorOutput ("=" * 50) -Color $Colors.White
    
    Write-ColorOutput "✅ Passed: $($Results.Passed.Count)" -Color $Colors.Green
    Write-ColorOutput "❌ Failed: $($Results.Failed.Count)" -Color $Colors.Red
    Write-ColorOutput "⚠️ Warnings: $($Results.Warnings.Count)" -Color $Colors.Yellow
    
    if ($Results.Fixed.Count -gt 0) {
        Write-ColorOutput "🔧 Fixed: $($Results.Fixed.Count)" -Color $Colors.Green
    }
    
    if ($Results.Failed.Count -gt 0) {
        Write-ColorOutput "`n❌ Failed Checks:" -Color $Colors.Red
        for ($i = 0; $i -lt $Results.Failed.Count; $i++) {
            $item = $Results.Failed[$i]
            Write-ColorOutput "  $($i + 1). $($item.Message)" -Color $Colors.White
            if ($item.Details -and $Verbose) {
                Write-ColorOutput "     $($item.Details)" -Color $Colors.Cyan
            }
            if ($item.Fixable -and $Verbose) {
                Write-ColorOutput "     Run with -Fix to attempt automatic fix" -Color $Colors.Cyan
            }
        }
    }
    
    if ($Results.Warnings.Count -gt 0) {
        Write-ColorOutput "`n⚠️ Warnings:" -Color $Colors.Yellow
        for ($i = 0; $i -lt $Results.Warnings.Count; $i++) {
            $item = $Results.Warnings[$i]
            Write-ColorOutput "  $($i + 1). $($item.Message)" -Color $Colors.White
            if ($item.Details -and $Verbose) {
                Write-ColorOutput "     $($item.Details)" -Color $Colors.Cyan
            }
        }
    }
    
    # Environment-specific recommendations
    Write-ColorOutput "`n💡 Recommendations:" -Color $Colors.Cyan
    Write-ColorOutput "  • For best results, also run: node scripts/diagnose-lightning.js --verbose" -Color $Colors.White
    Write-ColorOutput "  • Use Git Bash or WSL for Unix-like commands if needed" -Color $Colors.White
    
    if ($Results.Failed.Count -gt 0) {
        Write-ColorOutput "  • Run with -Fix to automatically create missing directories" -Color $Colors.White
        Write-ColorOutput "  • Use -Verbose for detailed output" -Color $Colors.White
    }
    
    Write-ColorOutput "  • Run this diagnostic before pushing to catch CI issues early" -Color $Colors.White
    Write-ColorOutput "  • Check the Tests_of_the_LaLiLuLeLo.md documentation for more details" -Color $Colors.White
    
    # Exit code determination
    $exitCode = if ($Results.Failed.Count -gt 0) { 1 } else { 0 }
    
    if ($exitCode -eq 0) {
        Write-ColorOutput "`n🎉 All diagnostics passed! Ready for CI." -Color $Colors.Green
    } else {
        Write-ColorOutput "`n💥 Some diagnostics failed. Fix issues before pushing." -Color $Colors.Red
    }
    
    return $exitCode
}

# Main execution
try {
    Write-ColorOutput "⚡ Lightning Network Diagnostics (PowerShell)" -Color $Colors.White
    Write-ColorOutput "Environment: Windows | PowerShell: $($PSVersionTable.PSVersion)" -Color $Colors.White
    Write-ColorOutput "Arguments: $(if ($Verbose) { '-Verbose ' })$(if ($Fix) { '-Fix' })" -Color $Colors.White
    Write-ColorOutput ""
    
    # Run all diagnostic checks
    Test-Environment
    Test-LightningFiles
    Test-Dependencies
    Test-TestStructure
    Test-LightningValidation
    
    # Generate final report
    $exitCode = Write-Report
    exit $exitCode
    
} catch {
    Write-ColorOutput "`nCritical error occurred:" -Color $Colors.Red
    Write-ColorOutput $_.Exception.Message -Color $Colors.Red
    if ($Verbose) {
        Write-ColorOutput $_.ScriptStackTrace -Color $Colors.Red
    }
    exit 2
}
