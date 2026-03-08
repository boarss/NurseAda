# Deploy NurseAda gateway + FHIR adapter so agent teams execute against real FHIR endpoints.
# FHIR spec: https://fhir.hl7.org/fhir/index.html
# Test server (R4): https://hapi.fhir.org/baseR4
#
# Usage: from repo root: .\scripts\deploy-agents.ps1

param(
    [int] $GatewayPort = 8080,
    [int] $FhirAdapterPort = 8011
)

$ErrorActionPreference = "Stop"
$RepoRoot = if ($PSScriptRoot) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { Get-Location }
if (-not (Test-Path (Join-Path $RepoRoot "services\gateway\app\agents"))) {
    throw "Run from repo root. Example: .\scripts\deploy-agents.ps1"
}

# Load .env so FHIR_BASE_URL and GATEWAY_* are set
$envFile = Join-Path $RepoRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

# Defaults so agents hit real FHIR endpoint
if (-not $env:FHIR_BASE_URL) { $env:FHIR_BASE_URL = "https://hapi.fhir.org/baseR4" }
if (-not $env:GATEWAY_FHIR_URL) { $env:GATEWAY_FHIR_URL = "http://localhost:$FhirAdapterPort" }

Write-Host "FHIR_BASE_URL=$env:FHIR_BASE_URL"
Write-Host "GATEWAY_FHIR_URL=$env:GATEWAY_FHIR_URL"
Write-Host "Starting FHIR adapter (port $FhirAdapterPort) and gateway (port $GatewayPort)..."

# Start FHIR adapter in background (uses FHIR_BASE_URL)
$fhirProc = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$FhirAdapterPort" `
    -WorkingDirectory (Join-Path $RepoRoot "services\fhir-adapter") `
    -PassThru -WindowStyle Hidden
$env:FHIR_PID = $fhirProc.Id

# Gateway needs GATEWAY_FHIR_URL pointing to local adapter
$env:GATEWAY_FHIR_URL = "http://127.0.0.1:$FhirAdapterPort"
Start-Sleep -Seconds 2

# Start gateway in current window so logs are visible (or use -WindowStyle Hidden and Wait)
Write-Host "Gateway starting at http://127.0.0.1:$GatewayPort (Ctrl+C to stop). FHIR adapter PID: $($fhirProc.Id)"
Set-Location (Join-Path $RepoRoot "services\gateway")
python -m uvicorn app.main:app --host 0.0.0.0 --port $GatewayPort
