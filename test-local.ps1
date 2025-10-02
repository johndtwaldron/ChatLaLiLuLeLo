#!/usr/bin/env pwsh
# ChatLaLiLuLeLo Local CI Test
# Verifies that the development environment is working correctly

Write-Host "Starting ChatLaLiLuLeLo Local CI Test..." -ForegroundColor Cyan

# 1. Check project structure
Write-Host "`nChecking project structure..." -ForegroundColor Yellow
$requiredPaths = @(
    "apps/mobile/package.json",
    "apps/edge/package.json", 
    "apps/edge/.dev.vars",
    "apps/mobile/src/features/chat/ChatScreen.tsx"
)

foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "OK $path exists" -ForegroundColor Green
    } else {
        Write-Host "ERROR $path missing" -ForegroundColor Red
        exit 1
    }
}

# 2. TypeScript compilation check
Write-Host "`nRunning TypeScript check..." -ForegroundColor Yellow
Push-Location "apps/mobile"
try {
    npm run typecheck
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK TypeScript compilation passed" -ForegroundColor Green
    } else {
        Write-Host "ERROR TypeScript compilation failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# 3. Check backend API keys
Write-Host "`nChecking backend configuration..." -ForegroundColor Yellow
$devVars = Get-Content "apps/edge/.dev.vars" -Raw
if ($devVars -match "OPENAI_API_KEY=sk-") {
    Write-Host "OK OpenAI API key configured" -ForegroundColor Green
} else {
    Write-Host "ERROR OpenAI API key not found or invalid" -ForegroundColor Red
    exit 1
}

# 4. Test backend health endpoint (if server is running)
Write-Host "`nTesting backend health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8787/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Backend health endpoint responding" -ForegroundColor Green
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   Version: $($health.version)" -ForegroundColor Gray
        Write-Host "   OpenAI configured: $($health.environment.openai_key_present)" -ForegroundColor Gray
    }
} catch {
    Write-Host "WARNING Backend not running (this is OK if testing UI only)" -ForegroundColor Yellow
    Write-Host "   To start: npm run dev from project root" -ForegroundColor Gray
}

Write-Host "`nLocal CI Test Complete!" -ForegroundColor Cyan
Write-Host "Ready to develop ChatLaLiLuLeLo v3" -ForegroundColor Green
