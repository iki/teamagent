param(
    [ValidateSet('bun', 'aube')][string] $Tool = 'bun',
    [string] $ConfiguredBunPath
)

$ErrorActionPreference = 'Stop'
$toolArguments = $args
$projectRoot = Split-Path -Parent $PSScriptRoot

function Get-PhysicalPath([string] $Path, [int] $Depth = 0) {
    if ($Depth -gt 64) { throw 'Tool path contains too many links or parent segments.' }
    $full = [IO.Path]::GetFullPath($Path)
    $parent = [IO.Path]::GetDirectoryName($full.TrimEnd('\', '/'))
    if ($parent) {
        $physicalParent = Get-PhysicalPath $parent ($Depth + 1)
        $full = Join-Path $physicalParent ([IO.Path]::GetFileName($full))
    }
    $item = Get-Item -LiteralPath $full -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        $target = @($item.Target)[0]
        if (-not $target) { throw 'Tool path has an unsupported reparse point.' }
        if (-not [IO.Path]::IsPathRooted($target)) { $target = Join-Path ([IO.Path]::GetDirectoryName($item.FullName)) $target }
        return Get-PhysicalPath $target ($Depth + 1)
    }
    return $item.FullName
}

function Get-PinnedExecutable([string] $Name, [string] $Version) {
    $overrideName = 'TEAMAGENT_' + $Name.ToUpperInvariant() + '_PATH'
    $override = [Environment]::GetEnvironmentVariable($overrideName)
    $candidates = @()
    if ($Name -eq 'bun' -and $ConfiguredBunPath) {
        if (-not [IO.Path]::IsPathRooted($ConfiguredBunPath)) { throw 'Configured Bun path must be absolute.' }
        $candidates = @($ConfiguredBunPath)
    } elseif ($null -ne $override) {
        if (-not [IO.Path]::IsPathRooted($override)) { throw "Invalid absolute $overrideName override." }
        $candidates = @($override)
    } elseif ($env:MISE_INSTALLS_DIR) {
        if (-not [IO.Path]::IsPathRooted($env:MISE_INSTALLS_DIR)) { throw 'MISE_INSTALLS_DIR must be absolute.' }
        $installs = Get-PhysicalPath $env:MISE_INSTALLS_DIR
        if ($Name -eq 'bun') { $candidates = @(Join-Path $installs "bun\$Version\bin\bun.exe") }
        else { $candidates = @((Join-Path $installs "aube\$Version\aube.exe"), (Join-Path $installs "aube\$Version\bin\aube.exe")) }
    } else {
        foreach ($entry in ($env:PATH -split ';')) {
            if ($entry -and [IO.Path]::IsPathRooted($entry)) { $candidates += Join-Path $entry "$Name.exe" }
        }
    }
    $executable = $null
    foreach ($candidate in $candidates) {
        if ($candidate -match '(?i)(^|[\\/])\.?shims?([\\/]|$)') { continue }
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        $physical = Get-PhysicalPath $candidate
        if ($physical -match '(?i)(^|[\\/])\.?shims?([\\/]|$)' -or [IO.Path]::GetFileName($physical) -ine "$Name.exe") { continue }
        $executable = $physical
        break
    }
    if (-not $executable) { throw "Missing physical $Name $Version; install the pinned tool or set $overrideName." }
    return $executable
}

try {
    $package = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
    $bunVersion = (Get-Content -LiteralPath (Join-Path $projectRoot '.bun-version') -Raw).Trim()
    if ($bunVersion -notmatch '^\d+\.\d+\.\d+(?:-[\w.-]+)?$' -or $package.engines.bun -ne $bunVersion) {
        throw 'Exact Bun version pins are missing or disagree.'
    }
    if ($package.packageManager -notmatch '^aube@(\d+\.\d+\.\d+(?:-[\w.-]+)?)$') {
        throw 'The exact Aube version pin is missing.'
    }
    $versions = @{ bun = $bunVersion; aube = $Matches[1] }
    $neededTools = if ($Tool -eq 'aube') { @('bun', 'aube') } else { @('bun') }
    $executables = @{}
    $directories = @()
    foreach ($needed in $neededTools) {
        $executables[$needed] = Get-PinnedExecutable $needed $versions[$needed]
        $directories += [IO.Path]::GetDirectoryName($executables[$needed])
    }
    $oldPath = $env:PATH
    $env:PATH = ($directories -join ';') + ';' + $oldPath
    try {
        foreach ($needed in $neededTools) {
            $observedVersion = (& $executables[$needed] --version | Out-String).Trim()
            if ($needed -eq 'aube' -and $observedVersion -match '^(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?: [a-z0-9]+-[a-z0-9]+(?: \(\d{4}-\d{2}-\d{2}\))?)?$') { $observedVersion = $Matches[1] }
            if ($LASTEXITCODE -ne 0 -or $observedVersion -ne $versions[$needed]) { throw "Expected $needed $($versions[$needed]); physical executable failed its version check." }
        }
        & $executables[$Tool] @toolArguments
        $toolExitCode = $LASTEXITCODE
    } finally { $env:PATH = $oldPath }
    exit $toolExitCode
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
