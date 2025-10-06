# Test Cloudflare Worker API accessibility
$workerUrl = "https://chatlalilulelo-backend-prod.chatlalilulelo.workers.dev"

Write-Host "Testing Cloudflare Worker accessibility..." -ForegroundColor Yellow
Write-Host "Worker URL: $workerUrl" -ForegroundColor Cyan

# Test health endpoint
Write-Host "`n1. Testing /health endpoint:" -ForegroundColor Green
try {
    $healthResponse = Invoke-WebRequest -Uri "$workerUrl/health" -Method GET -TimeoutSec 10
    Write-Host "Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($healthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test chat endpoint with mock data
Write-Host "`n2. Testing /chat endpoint (mock mode):" -ForegroundColor Green
$testPayload = @{
    message = "ping"
    mode = "jd"
    model = "mock"
    mock = $true
} | ConvertTo-Json -Depth 3

try {
    $chatResponse = Invoke-WebRequest -Uri "$workerUrl/chat" -Method POST -ContentType "application/json" -Body $testPayload -TimeoutSec 10
    Write-Host "Status: $($chatResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($chatResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n3. Checking if Access is enabled:" -ForegroundColor Green
if ($healthResponse.Content -like "*Cloudflare Access*" -or $chatResponse.Content -like "*Cloudflare Access*") {
    Write-Host "❌ CLOUDFLARE ACCESS IS ENABLED - This is blocking your API!" -ForegroundColor Red
    Write-Host "   Go to Cloudflare Dashboard → Security → Access and disable it for your worker" -ForegroundColor Yellow
} else {
    Write-Host "✅ API is accessible" -ForegroundColor Green
}

Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. If Access is blocking, disable it in Cloudflare Dashboard" -ForegroundColor White
Write-Host "2. Set GitHub repo variable DEMO_API_URL = $workerUrl" -ForegroundColor White
Write-Host "3. Push to develop-v4 to trigger new deployment" -ForegroundColor White
