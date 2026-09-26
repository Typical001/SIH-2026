$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backendPython = Join-Path $projectRoot 'backend\venv\Scripts\python.exe'
$nodePath = Join-Path $projectRoot 'nodejs\node.exe'
if (-not (Test-Path -LiteralPath $nodePath)) { $nodePath = (Get-Command node -ErrorAction Stop).Source }
if (-not (Test-Path -LiteralPath $backendPython)) { throw 'Run Setup-Project.ps1 first.' }
foreach ($port in @(8000,3000)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Stop the existing project before starting another copy." }
}
$runDir = Join-Path $projectRoot '.run'
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$backendProcess = Start-Process -FilePath $backendPython -ArgumentList @('-m','uvicorn','main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runDir 'backend.log') -RedirectStandardError (Join-Path $runDir 'backend-error.log') -PassThru
$vitePath = Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'
$frontendProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $vitePath + '"'),'--host','127.0.0.1','--port','3000','--strictPort') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runDir 'frontend.log') -RedirectStandardError (Join-Path $runDir 'frontend-error.log') -PassThru
$tracked = @($backendProcess.Id,$frontendProcess.Id)
for ($attempt=0; $attempt -lt 90; $attempt++) {
    Start-Sleep -Milliseconds 500
    $listeners = @(Get-NetTCPConnection -LocalPort 8000,3000 -State Listen -ErrorAction SilentlyContinue)
    if (($listeners.LocalPort | Sort-Object -Unique).Count -eq 2) { break }
}
$tracked += @($listeners | Select-Object -ExpandProperty OwningProcess)
$records = @($tracked | Sort-Object -Unique | ForEach-Object {
    $process = Get-Process -Id $_ -ErrorAction SilentlyContinue
    if ($process) { @{id=$process.Id; startTicks=$process.StartTime.ToUniversalTime().Ticks} }
})
ConvertTo-Json -InputObject $records | Set-Content -LiteralPath (Join-Path $runDir 'processes.json')
try {
    $health = Invoke-RestMethod 'http://127.0.0.1:8000/api/health' -TimeoutSec 5
    Invoke-WebRequest 'http://127.0.0.1:3000/' -TimeoutSec 5 -UseBasicParsing | Out-Null
    if ($health.version -ne '2.0.0') { throw 'Unexpected backend version.' }
    Write-Host 'Project running at http://127.0.0.1:3000/ . Stop with .\Stop-Project.ps1'
} catch {
    & (Join-Path $projectRoot 'Stop-Project.ps1')
    throw "Startup failed. Read .run logs. $($_.Exception.Message)"
}
