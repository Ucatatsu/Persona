param(
  [string]$Port = "5173"
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repo

Write-Host "Starting dev runner in $repo" -ForegroundColor Cyan

# Kill existing server on 8080 if any (optional safety)
try {
  $list = netstat -ano | Select-String ":8080" | ForEach-Object {
    ($_ -split "\s+")[-1]
  } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique
  foreach ($pid in $list) {
    Write-Host "Killing process on 8080 (PID=$pid)" -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
} catch { }

$serverJob = Start-Job -Name "server" -ScriptBlock {
  param($root)
  Set-Location $root
  go run cmd/server/main.go
} -ArgumentList $repo

$clientJob = Start-Job -Name "client" -ScriptBlock {
  param($clientDir, $port)
  Set-Location $clientDir
  $env:PORT = $port
  npm.cmd run dev
} -ArgumentList (Join-Path $repo "client"), $Port

Write-Host "Dev runner started. Press Ctrl+C to stop." -ForegroundColor Green

$stop = $false
Register-EngineEvent PowerShell.Exiting -Action {
  try {
    Stop-Job -Name client -Force -ErrorAction SilentlyContinue
    Stop-Job -Name server -Force -ErrorAction SilentlyContinue
    Receive-Job -Name client -Keep | Out-Null
    Receive-Job -Name server -Keep | Out-Null
  } catch { }
}

try {
  while (-not $stop) {
    try {
      Receive-Job -Name server -Keep -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[server] $_" -ForegroundColor Magenta }
    } catch { }
    try {
      Receive-Job -Name client -Keep -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[client] $_" -ForegroundColor Cyan }
    } catch { }
    Start-Sleep -Milliseconds 200
  }
} finally {
  try {
    Stop-Job -Name client -Force -ErrorAction SilentlyContinue
    Stop-Job -Name server -Force -ErrorAction SilentlyContinue
  } catch { }
}
