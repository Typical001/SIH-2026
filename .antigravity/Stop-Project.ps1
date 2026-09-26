$ErrorActionPreference = 'Stop'
$statePath = Join-Path $PSScriptRoot '.run\processes.json'
if (-not (Test-Path -LiteralPath $statePath)) { Write-Host 'No project processes recorded. Use Ctrl+C in manually started terminals.'; exit }
$records = @(Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json)
foreach ($record in $records) {
    $process = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq $record.startTicks) {
        Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    }
}
Remove-Item -LiteralPath $statePath
Write-Host 'Recorded project processes stopped.'
