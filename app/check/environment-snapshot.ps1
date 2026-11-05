# Invoked through private owned pipes, never dot-sourced or logged.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$snapshotEnvironment = @{}
foreach ($entry in [Environment]::GetEnvironmentVariables('Process').GetEnumerator()) {
    $snapshotEnvironment[[string] $entry.Key] = [string] $entry.Value
}
$snapshot = @{ version = 1; environment = $snapshotEnvironment }
[Console]::Out.Write(($snapshot | Microsoft.PowerShell.Utility\ConvertTo-Json -Compress -Depth 3))
