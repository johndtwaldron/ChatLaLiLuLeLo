# MGS2 Codec Launcher
param([switch]$SkipBrowser)

Write-Host '[CODEC] MGS2 Communication System Launcher' -ForegroundColor Cyan
Write-Host '[CODEC] Checking dependencies...' -ForegroundColor Green

try {
    $nodeVersion = node --version
    Write-Host '[CODEC] Node.js found:' $nodeVersion -ForegroundColor Green
} catch {
    Write-Host '[CODEC] ERROR: Node.js not found!' -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host '[CODEC] npm found:' $npmVersion -ForegroundColor Green
} catch {
    Write-Host '[CODEC] ERROR: npm not found!' -ForegroundColor Red
    exit 1
}

Write-Host '[CODEC] All dependencies verified' -ForegroundColor Green
Write-Host '[CODEC] Ready to launch development environment' -ForegroundColor Cyan

if (-not $SkipBrowser) {
    Write-Host '[CODEC] Would launch browser at http://localhost:3000' -ForegroundColor Yellow
} else {
    Write-Host '[CODEC] Skipping browser launch' -ForegroundColor Yellow
}
