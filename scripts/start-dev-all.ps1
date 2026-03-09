# Start all NurseAda dev servers (CDSS, XAI, Gateway, Web).
# Run from repo root: .\scripts\start-dev-all.ps1
# Then open http://localhost:3000 and go to Chat.

$ErrorActionPreference = "Stop"
$RepoRoot = if ($PSScriptRoot) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { Get-Location }

Write-Host "Starting CDSS (8002)..."
Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002" `
  -WorkingDirectory (Join-Path $RepoRoot "services\cdss") -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "Starting XAI (8012)..."
Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8012" `
  -WorkingDirectory (Join-Path $RepoRoot "services\xai") -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host "Starting Knowledge (8003)..."
Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8003" `
  -WorkingDirectory (Join-Path $RepoRoot "services\knowledge") -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "Starting Gateway (8080)..."
$env:GATEWAY_CDSS_URL = "http://127.0.0.1:8002"
$env:GATEWAY_XAI_URL = "http://127.0.0.1:8012"
$env:GATEWAY_KNOWLEDGE_URL = "http://127.0.0.1:8003"
Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8080" `
  -WorkingDirectory (Join-Path $RepoRoot "services\gateway") -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "Starting Web (3000)..."
Write-Host ""
Write-Host "Open http://localhost:3000 then click Start chat."
Write-Host "Backend: CDSS=8002, XAI=8012, Knowledge=8003, Gateway=8080."
Write-Host ""
Set-Location (Join-Path $RepoRoot "apps\web")
npm run dev
