$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath 'backend\venv\Scripts\python.exe')) {
    python -m venv backend\venv
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.11 or newer is required.' }
}
& '.\backend\venv\Scripts\python.exe' -m pip install -r backend\requirements-dev.txt
if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
Push-Location frontend
try {
    if (Test-Path -LiteralPath '..\nodejs\npm.cmd') { & '..\nodejs\npm.cmd' ci } else { npm ci }
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
} finally { Pop-Location }
Write-Host 'Setup complete. Run .\Start-Project.ps1'
