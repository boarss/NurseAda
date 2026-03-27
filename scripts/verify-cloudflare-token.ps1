# Verify a Cloudflare API token (PowerShell-native).
# Avoids `curl` in PowerShell — it aliases to Invoke-WebRequest and breaks -H / Unix flags.
#
# Token resolution order: -Token parameter → $env:CLOUDFLARE_API_TOKEN → repo root .env (CLOUDFLARE_API_TOKEN=)
param(
  [string]$Token = $env:CLOUDFLARE_API_TOKEN
)

$RepoRoot = if ($PSScriptRoot) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { (Get-Location).Path }
$RootEnv = Join-Path $RepoRoot ".env"

function Get-EnvFileValue([string]$path, [string]$key) {
  if (-not (Test-Path $path)) { return $null }
  foreach ($raw in Get-Content $path) {
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }
    if ($line -match "^\s*([^=]+)=(.*)$") {
      $k = $Matches[1].Trim()
      if ($k -ne $key) { continue }
      $v = $Matches[2].Trim()
      if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
        $v = $v.Substring(1, $v.Length - 2)
      }
      return $v
    }
  }
  return $null
}

if (-not $Token) {
  $Token = Get-EnvFileValue $RootEnv "CLOUDFLARE_API_TOKEN"
}

if (-not $Token) {
  Write-Error @"
No token found. Do one of:
  - Set `$env:CLOUDFLARE_API_TOKEN` in this PowerShell session, or
  - Add CLOUDFLARE_API_TOKEN=... to repo root .env, or
  - Run: .\scripts\verify-cloudflare-token.ps1 -Token 'your_token'

Root .env path: $RootEnv
"@
  exit 1
}

$uri = "https://api.cloudflare.com/client/v4/user/tokens/verify"
$headers = @{ Authorization = "Bearer $Token" }

try {
  $r = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
  if ($r.success) {
    Write-Host "OK: Cloudflare token is valid."
    if ($r.result.status) {
      Write-Host "Status:" $r.result.status
    }
    exit 0
  }
  Write-Host ($r | ConvertTo-Json -Depth 6)
  exit 1
}
catch {
  Write-Error $_
  exit 1
}
