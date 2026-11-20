param([ValidateSet('bun', 'aube')][string] $Tool = 'bun')

$ErrorActionPreference = 'Stop'
$configuredBunPath = $null
$toolArguments = $args
# The optional launcher override is named. The first ordinary argument belongs to the tool.
if ($args.Count -gt 0 -and $args[0] -eq '-ConfiguredBunPath') {
    if ($args.Count -lt 2) { throw 'Missing -ConfiguredBunPath value.' }
    $configuredBunPath = $args[1]
    $toolArguments = [object[]]::new($args.Length - 2)
    [Array]::Copy($args, 2, $toolArguments, 0, $toolArguments.Length)
}
# Native invocation must retain empty strings, quotes and trailing backslashes.
if ($PSVersionTable.PSVersion -ge [version]'7.3') {
    $PSNativeCommandArgumentPassing = 'Standard'
} else {
    foreach ($argument in $toolArguments) {
        if ([string]::IsNullOrEmpty($argument) -or $argument -match '"' -or
            ($argument -match '\s' -and $argument.EndsWith('\'))) {
            throw 'These literal tool arguments require PowerShell 7.3 or newer (pwsh).'
        }
    }
}
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

function Find-PhysicalExecutable([string[]] $Candidates, [string] $Name) {
    foreach ($candidate in $Candidates) {
        if ($candidate -match '(?i)(^|[\\/])\.?shims?([\\/]|$)') { continue }
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        $physical = Get-PhysicalPath $candidate
        if ($physical -match '(?i)(^|[\\/])\.?shims?([\\/]|$)' -or [IO.Path]::GetFileName($physical) -ine "$Name.exe") { continue }
        return $physical
    }
}

function Invoke-ToolProbe([string] $File, [string] $ProbeArguments, [hashtable] $Controls, [string] $Failure) {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $File
    $start.WorkingDirectory = $projectRoot
    $start.Arguments = $ProbeArguments
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false, $true)
    foreach ($key in $Controls.Keys) {
        if ($null -eq $Controls[$key]) { $start.EnvironmentVariables.Remove($key) }
        else { $start.EnvironmentVariables[$key] = $Controls[$key] }
    }
    $child = [Diagnostics.Process]::Start($start)
    try {
        $buffer = [char[]]::new(32769)
        $read = $child.StandardOutput.ReadBlockAsync($buffer, 0, $buffer.Length)
        $drain = $child.StandardError.BaseStream.CopyToAsync([IO.Stream]::Null)
        if (-not [Threading.Tasks.Task]::WaitAll([Threading.Tasks.Task[]]@($read, $drain), 10000) -or
            -not $child.WaitForExit(1000) -or $child.ExitCode -ne 0 -or $read.Result -eq $buffer.Length) {
            throw $Failure
        }
        return ([string]::new($buffer, 0, $read.Result) -replace '\r?\n\z', '')
    } finally {
        if (-not $child.HasExited) { $child.Kill(); $null = $child.WaitForExit(1000) }
        $child.Dispose()
    }
}

function Find-MiseTool([string[]] $Directories, [string] $Name, [string] $Version) {
    $misePaths = @($Directories | ForEach-Object { Join-Path $_ 'mise.exe' })
    $mise = Find-PhysicalExecutable $misePaths 'mise'
    if (-not $mise) { return }
    $reported = Invoke-ToolProbe $mise "--no-config which $Name --tool $Name@$Version" @{
        MISE_AUTO_INSTALL = 'false'; MISE_OFFLINE = 'true'
    } "Mise could not locate the installed $Name $Version."
    if ($reported -match '[\x00\r\n]' -or $reported -notmatch '^(?:[a-z]:[\\/]|\\\\[^\\]+\\[^\\]+)') {
        throw "Mise returned an invalid $Name path."
    }
    return Find-PhysicalExecutable @($reported) $Name
}

function Get-PinnedExecutable([string] $Name, [string] $Version) {
    $overrideName = 'TEAMAGENT_' + $Name.ToUpperInvariant() + '_PATH'
    $override = [Environment]::GetEnvironmentVariable($overrideName)
    $candidates = @()
    $directories = @()
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
        else {
            $candidates = @(
                (Join-Path $installs "aube\$Version\.mise-bins\aube.exe")
                (Join-Path $installs "aube\$Version\aube.exe")
                (Join-Path $installs "aube\$Version\bin\aube.exe")
            )
        }
    } else {
        $directories = @($env:PATH -split ';' | Where-Object { $_ -and [IO.Path]::IsPathRooted($_) })
        $candidates = @($directories | ForEach-Object { Join-Path $_ "$Name.exe" })
    }
    $executable = Find-PhysicalExecutable $candidates $Name
    if (-not $executable -and $directories.Count) {
        $executable = Find-MiseTool $directories $Name $Version
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
            $probeSettings = if ($needed -eq 'aube') {
                @{
                    npm_config_manage_package_manager_versions = $null
                    AUBE_MANAGE_PACKAGE_MANAGER_VERSIONS = 'false'
                    AUBE_NO_UPDATE_CHECK = '1'
                }
            } else { @{} }
            $observedVersion = Invoke-ToolProbe $executables[$needed] '--version' $probeSettings "Expected $needed $($versions[$needed]); physical executable failed its version check."
            if ($needed -eq 'aube' -and $observedVersion -match '^(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?: [a-z0-9]+-[a-z0-9]+(?: \(\d{4}-\d{2}-\d{2}\))?)?$') { $observedVersion = $Matches[1] }
            if ($observedVersion -ne $versions[$needed]) { throw "Expected $needed $($versions[$needed]); physical executable failed its version check." }
        }
        & $executables[$Tool] @toolArguments
        $toolExitCode = $LASTEXITCODE
    } finally { $env:PATH = $oldPath }
    exit $toolExitCode
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
