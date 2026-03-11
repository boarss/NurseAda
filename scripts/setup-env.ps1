# NurseAda – copy root .env vars to service-specific .env files.
# Run from repo root: .\scripts\setup-env.ps1
# Requires a root .env file (copy from .env.example first).

$ErrorActionPreference = "Stop"
$RepoRoot = if ($PSScriptRoot) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { (Get-Location).Path }
$RootEnv = Join-Path $RepoRoot ".env"

if (-not (Test-Path $RootEnv)) {
    Write-Host "No .env found at repo root. Copy .env.example to .env first:"
    Write-Host "  Copy-Item .env.example .env"
    Write-Host "Then edit .env with your values and run this script again."
    exit 1
}

# Read root .env into a hashtable
$vars = @{}
Get-Content $RootEnv | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line -match "^\s*([^=]+)=(.*)$") {
        $vars[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

function Write-EnvFile($path, $keys) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { return }
    $lines = @()
    foreach ($k in $keys) {
        $v = if ($vars.ContainsKey($k)) { $vars[$k] } else { "" }
        $lines += "$k=$v"
    }
    $lines | Set-Content $path -Encoding utf8
    Write-Host "Wrote $path"
}

# Gateway
$gatewayEnv = Join-Path $RepoRoot "services\gateway\.env"
$gatewayKeys = @(
    "GATEWAY_FHIR_URL", "GATEWAY_LLM_URL", "GATEWAY_CDSS_URL", "GATEWAY_KNOWLEDGE_URL",
    "GATEWAY_XAI_URL", "PHARMACY_API_URL", "LAB_API_URL", "EMERGENCY_API_URL",
    "CORS_ALLOW_ORIGINS", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_JWT_SECRET", "SUPABASE_SERVICE_ROLE_KEY"
)
Write-EnvFile $gatewayEnv $gatewayKeys

# LLM Gateway
$llmEnv = Join-Path $RepoRoot "services\llm-gateway\.env"
$llmKeys = @("OPENAI_API_KEY", "OPENAI_BASE_URL", "VISION_MODEL", "COMPLETION_MODEL")
Write-EnvFile $llmEnv $llmKeys

# FHIR Adapter
$fhirEnv = Join-Path $RepoRoot "services\fhir-adapter\.env"
$fhirKeys = @("FHIR_BASE_URL")
Write-EnvFile $fhirEnv $fhirKeys

# Web app
$webEnv = Join-Path $RepoRoot "apps\web\.env.local"
$webKeys = @("NEXT_PUBLIC_GATEWAY_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
Write-EnvFile $webEnv $webKeys

# Mobile app
$mobileEnv = Join-Path $RepoRoot "apps\mobile\.env"
$mobileKeys = @("EXPO_PUBLIC_GATEWAY_URL", "EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY")
Write-EnvFile $mobileEnv $mobileKeys

Write-Host ""
Write-Host "Done. Edit .env with your API keys, then run setup-env.ps1 again to propagate."
