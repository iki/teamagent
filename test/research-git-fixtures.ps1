param([string]$ProjectRoot=([IO.Path]::GetFullPath('..',$PSScriptRoot)),[switch]$IdentityFixture)
$ErrorActionPreference='Stop'
$pathComparison=if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
$ProjectRoot=[IO.Path]::GetFullPath($ProjectRoot)
if (-not $ProjectRoot.Equals([IO.Path]::GetFullPath('..',$PSScriptRoot),$pathComparison)) { throw 'research_fixture_project_mismatch' }
. (Join-Path $ProjectRoot 'app/research/git-sync.ps1')

# The command runner owns this marked directory until every descendant stops.
# Validate both possible layouts: a direct command, or a command beneath its enclosing owner.
function Get-FixtureOwnerToken([string]$Directory,[string]$LabelPattern) {
    $tokenPattern='[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}'
    $leaf=[regex]::Match([IO.Path]::GetFileName($Directory),('\Arun-'+$LabelPattern+'-(?<token>'+$tokenPattern+')\z'))
    if (-not $leaf.Success -or -not (Test-Path -LiteralPath $Directory -PathType Container)) { throw 'research_fixture_owner_directory_invalid' }
    $marker=Get-ResearchSafePath $Directory '.owner.json'
    $item=Get-Item -LiteralPath $marker -Force
    if ($item.PSIsContainer -or -not [string]::IsNullOrEmpty($item.LinkType)) { throw 'research_fixture_marker_not_private' }
    $text=Read-ResearchText $marker 4096
    if ($text.Contains("`r") -or -not $text.EndsWith("`n")) { throw 'research_fixture_marker_not_lf' }
    $document=$null
    try {
        $document=[Text.Json.JsonDocument]::Parse($text)
        $owner=$document.RootElement
        $keys=@($owner.EnumerateObject() | ForEach-Object { $_.Name } | Sort-Object)
        if (($keys -join ',') -cne 'createdAt,host,pid,token,version') { throw 'invalid_fields' }
        $token=$owner.GetProperty('token').GetString()
        $creator=$owner.GetProperty('pid').GetInt32()
        $created=$owner.GetProperty('createdAt').GetInt64()
        if ($owner.GetProperty('version').GetInt32() -ne 1 -or $token -cne $leaf.Groups['token'].Value -or $creator -le 0 -or $created -lt 0 -or $created -gt 9007199254740991 -or -not $owner.GetProperty('host').GetString().Equals([Net.Dns]::GetHostName(),$pathComparison)) { throw 'invalid_owner' }
        $process=[Diagnostics.Process]::GetProcessById($creator)
        try { if ($process.HasExited) { throw 'owner_exited' } } finally { $process.Dispose() }
    } catch { throw 'research_fixture_owner_invalid' } finally { if ($null -ne $document) { $document.Dispose() } }
    return $token
}
$temporaryRoot=Join-Path $ProjectRoot '.tmp'
if (-not [IO.Path]::IsPathFullyQualified($env:TEMP) -or -not [IO.Path]::IsPathFullyQualified($env:TEAMAGENT_TEMPORARY_PARENT) -or -not $ProjectRoot.Equals($env:TEAMAGENT_TEMPORARY_ROOT,$pathComparison)) { throw 'research_fixture_command_scratch_required' }
$scratch=Get-ResearchSafePath $temporaryRoot (Get-ResearchRelativePath $temporaryRoot $env:TEMP)
if (-not $scratch.Equals($env:TEMP,$pathComparison) -or -not $scratch.Equals($env:TMP,$pathComparison) -or -not $scratch.Equals($env:TMPDIR,$pathComparison)) { throw 'research_fixture_command_scratch_mismatch' }
$commandToken=Get-FixtureOwnerToken $scratch 'command'
$container=Get-ResearchSafePath $temporaryRoot (Get-ResearchRelativePath $temporaryRoot $env:TEAMAGENT_TEMPORARY_PARENT)
if (-not $container.Equals($env:TEAMAGENT_TEMPORARY_PARENT,$pathComparison) -or -not ([IO.Path]::GetDirectoryName($container)).Equals($temporaryRoot,$pathComparison)) { throw 'research_fixture_container_invalid' }
if ($scratch.Equals($container,$pathComparison)) { $containerToken=$commandToken } else {
    if (-not ([IO.Path]::GetDirectoryName($scratch)).Equals($container,$pathComparison)) { throw 'research_fixture_command_parent_mismatch' }
    $containerToken=Get-FixtureOwnerToken $container '[a-z0-9-]{1,24}'
}
if ($containerToken -cne $env:TEAMAGENT_TEMPORARY_PARENT_ID) { throw 'research_fixture_container_token_mismatch' }
$fixture=Get-ResearchSafePath $scratch 'g'
# New-Item without Force refuses an existing child, including an unexpected checkout.
$createdFixture=New-Item -Path $scratch -Name 'g' -ItemType Directory -ErrorAction Stop
if (-not $createdFixture.PSIsContainer -or -not $createdFixture.FullName.Equals($fixture,$pathComparison) -or ($createdFixture.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'research_fixture_child_invalid' }
if (-not $IsWindows) { [IO.File]::SetUnixFileMode($fixture,([IO.UnixFileMode]::UserRead -bor [IO.UnixFileMode]::UserWrite -bor [IO.UnixFileMode]::UserExecute)) }
if ($IdentityFixture) {
    & (Join-Path $PSScriptRoot 'research-git-identities-fixtures.ps1') -ProjectRoot $ProjectRoot -FixtureRoot $fixture
    [Console]::Write('FIXTURE_PATH '+(Get-ResearchRelativePath $ProjectRoot $fixture)+"`n")
    return
}
function Assert-That([bool]$Condition,[string]$Name) { if (-not $Condition) { throw ('assertion_failed: '+$Name) }; [Console]::Write('PASS '+$Name+"`n") }
function Put([string]$Path,[string]$Text) { [IO.File]::WriteAllText($Path,$Text,[Text.UTF8Encoding]::new($false)) }
function Git([string]$Directory,[string[]]$Arguments) { $r=Invoke-ResearchGit $Directory $Arguments '' 15; if ($r.exitCode -ne 0) { throw ('fixture_git_failed: '+($Arguments -join ' ')+' '+$r.stderr) }; return $r.stdout.Trim() }
function Get-FixtureGitRefPair([string]$Directory,[string]$First,[string]$Second) {
    $result=Invoke-ResearchGit $Directory @('rev-parse','--revs-only','--end-of-options',$First,$Second) '' 15
    if ($result.exitCode -ne 0 -or $result.stdout -isnot [string] -or $result.stdout.Length -gt 130) { throw 'fixture_git_ref_pair_failed' }
    $pair=[regex]::Match($result.stdout,'\A([a-f0-9]{40}|[a-f0-9]{64})\n([a-f0-9]{40}|[a-f0-9]{64})\n\z',[Text.RegularExpressions.RegexOptions]::CultureInvariant)
    if (-not $pair.Success -or $pair.Groups[1].Length -ne $pair.Groups[2].Length) { throw 'fixture_git_ref_pair_invalid' }
    return @($pair.Groups[1].Value,$pair.Groups[2].Value)
}
function Rejects([scriptblock]$Operation,[string]$Name) { $rejected=$false; try { & $Operation | Out-Null } catch { $rejected=$true }; Assert-That $rejected $Name }
function Set-FixtureGitIdentity([string]$Directory) {
    $configuration=Join-Path $Directory '.git/config'
    Put $configuration ((ConvertTo-ResearchLfText (Read-ResearchText $configuration))+"`n[commit]`n gpgsign = false`n[user]`n name = Fixture`n email = fixture@example.invalid`n")
    $rows=(Git $Directory @('config','--local','--null','--get-regexp','^(commit\.gpgsign|user\.(name|email))$')).Split([char]0)
    $valid=$rows.Count -eq 4 -and $rows[3] -ceq ''
    foreach ($expected in @("commit.gpgsign`nfalse","user.name`nFixture","user.email`nfixture@example.invalid")) {
        if (@($rows | Where-Object { $_ -ceq $expected }).Count -ne 1) { $valid=$false }
    }
    Assert-That $valid 'fixture Git identity has exact parsed values'
}
$root=Join-Path $fixture 'project';$source=Join-Path $fixture 'source';$remote=Join-Path $fixture 'remote.git';$work=Join-Path $fixture 'work'
foreach ($dir in @($root,$source,$work)) { [void][IO.Directory]::CreateDirectory($dir) }
# Serialized formatting is normalized; escaped CR in JSON string values stays data.
$lfTextPath=Join-Path $fixture 'lf-output.txt'
Write-ResearchTextFile $lfTextPath "Žluťoučký`r`nsecond`rthird`n"
Assert-That ([Convert]::ToBase64String([IO.File]::ReadAllBytes($lfTextPath)) -eq [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("Žluťoučký`nsecond`nthird`n"))) 'generated text is exact UTF-8 LF without BOM'
$lfJsonPath=Join-Path $fixture 'lf-output.json'
$lfValue=@{label='Žluťoučký';sourceText="first`r`nsecond`rthird"}
Write-ResearchJson $lfJsonPath $lfValue
Assert-That (-not ([IO.File]::ReadAllBytes($lfJsonPath) -contains 13) -and (ConvertFrom-Json (Read-ResearchText $lfJsonPath)).sourceText -ceq $lfValue.sourceText) 'JSON formatting uses LF while escaped source string remains unchanged'
$lfConsole=[IO.StringWriter]::new();$lfConsole.NewLine="`r`n";$savedConsole=[Console]::Out
try { [Console]::SetOut($lfConsole); Write-ResearchJsonOutput $lfValue } finally { [Console]::SetOut($savedConsole) }
Assert-That (-not $lfConsole.ToString().Contains("`r") -and $lfConsole.ToString().EndsWith("`n") -and (ConvertFrom-Json $lfConsole.ToString()).label -ceq 'Žluťoučký') 'CLI JSON output overrides writer newline without altering data'
$lfConsole.Dispose()

# Validate the combined inspection protocol without launching more native commands.
foreach ($width in @(40,64)) {
    $metadataHead='a'*$width
    foreach ($shallowValue in @('true','false')) {
        $metadata=ConvertFrom-ResearchCheckoutMetadata ($shallowValue+"`n"+$metadataHead+"`n")
        Assert-That ($metadata.head -ceq $metadataHead -and $metadata.shallow -eq ($shallowValue -ceq 'true')) 'checkout metadata retains exact object identity and shallow flag'
    }
}
foreach ($invalidMetadata in @(
    $null,17,@{head=('a'*40)},'',
    ("false`n"+('a'*40)),
    ("false`r`n"+('a'*40)+"`r`n"),
    ("false`n"+('a'*40)+"`nextra`n"),
    ("false`n"+('a'*40)+"`n`n"),
    ("False`n"+('a'*40)+"`n"),
    ("unknown`n"+('a'*40)+"`n"),
    ("false`n"+('A'*40)+"`n"),
    ("false`n"+('a'*41)+"`n"),
    ("false`n"+('a'*65)+"`n")
)) { Rejects { ConvertFrom-ResearchCheckoutMetadata $invalidMetadata } 'checkout metadata rejects malformed or incomplete fields' }

Put (Join-Path $root '.env') "TEAMAGENT_GIT_SOURCES_DIR=../source`nTEAMAGENT_GIT_CACHE=cache`n"
Put (Join-Path $root '.env.local') "TEAMAGENT_GIT_CACHE=cache local`n"
$settings=Get-ResearchSettings $root
Assert-That ($settings.GitCache -eq (Join-Path $root 'cache local')) 'dotenv precedence and literal spaces'
$invalid=@('TEAMAGENT_UNKNOWN=x','TEAMAGENT_git_CACHE=x','TEAMAGENT_GIT_AUTO_STASH=yes',"TEAMAGENT_GIT_CACHE=x`nTEAMAGENT_GIT_CACHE=y",'TEAMAGENT_GIT_CACHE=$(touch pwned)','TEAMAGENT_GIT_CACHE=`whoami`','TEAMAGENT_GIT_OUTDATED_THRESHOLD=4w','TEAMAGENT_GIT_BACKUP_ACCOUNT=bad-')
foreach ($value in $invalid) { Put (Join-Path $root '.env.local') $value; Rejects { Get-ResearchSettings $root } ('dotenv rejects '+$value.Split('=')[0]) }
Put (Join-Path $root '.env.local') 'TEAMAGENT_GIT_CACHE='
Assert-That ((Get-ResearchSettings $root).GitCache -eq (Join-Path $root '.cache/git')) 'empty cache uses default'
Put (Join-Path $root '.env.local') ''
$settings=Get-ResearchSettings $root
Assert-That ((Get-ResearchCutoff ([DateTimeOffset]'2026-03-31T12:00:00Z') '1m').Day -eq 28) 'calendar month cutoff'
Rejects { Get-ResearchSafePath $settings.GitCache '../escape' } 'cache traversal rejected'
# Directory publication and lifecycle renames share a native, bounded operation.
$moveRoot=Join-Path $fixture 'rename-tests'
$moveSource=Join-Path $moveRoot 'source'
$moveTarget=Join-Path $moveRoot 'destination'
[void][IO.Directory]::CreateDirectory((Join-Path $moveSource '.git'))
Put (Join-Path $moveSource '.git/evidence') 'retained tree'
$originalDirectoryMove=(Get-Item function:Move-ResearchDirectory).ScriptBlock
$script:directoryMoveCalls=0
function Move-ResearchDirectory([string]$Source,[string]$Destination) {
    $script:directoryMoveCalls++
    if ($script:directoryMoveCalls -eq 1) { throw [IO.IOException]::new('injected sharing violation',-2147024864) }
    [IO.Directory]::Move($Source,$Destination)
}
$move=Move-ResearchRepositoryDirectory $moveRoot $moveSource $moveTarget
Assert-That ($move.success -and $move.attempts -eq 2 -and $move.failures[0].nativeCode -eq 32 -and $move.failures[0].hresult -eq '0x80070020' -and $move.failures[0].exceptionType -eq 'System.IO.IOException' -and -not (Test-Path -LiteralPath $moveSource) -and (Read-ResearchText (Join-Path $moveTarget '.git/evidence')) -eq 'retained tree') 'atomic directory move retries injected sharing violation with diagnostics'
[void][IO.Directory]::CreateDirectory($moveSource)
Put (Join-Path $moveSource 'source-evidence') 'untouched source'
$move=Move-ResearchRepositoryDirectory $moveRoot $moveSource $moveTarget
Assert-That (-not $move.success -and $move.error -eq 'directory_rename_destination_exists' -and $move.attempts -eq 0 -and $script:directoryMoveCalls -eq 2 -and (Read-ResearchText (Join-Path $moveSource 'source-evidence')) -eq 'untouched source' -and (Read-ResearchText (Join-Path $moveTarget '.git/evidence')) -eq 'retained tree') 'existing directory destination is never merged or overwritten'
$blockedTarget=Join-Path $moveRoot 'blocked'
$script:directoryMoveCalls=0
function Move-ResearchDirectory([string]$Source,[string]$Destination) { $script:directoryMoveCalls++;throw [UnauthorizedAccessException]::new('injected access denial') }
$move=Move-ResearchRepositoryDirectory $moveRoot $moveSource $blockedTarget
Assert-That (-not $move.success -and $move.error -eq 'directory_rename_sharing_or_access_exhausted' -and $move.attempts -eq 4 -and $script:directoryMoveCalls -eq 4 -and $move.failures[3].nativeCode -eq 5 -and (Test-Path -LiteralPath $moveSource) -and -not (Test-Path -LiteralPath $blockedTarget)) 'permanent access denial stops after four attempts and retains source'
$script:directoryMoveCalls=0
function Move-ResearchDirectory([string]$Source,[string]$Destination) { $script:directoryMoveCalls++;throw [IO.IOException]::new('injected unrelated disk failure',-2147024784) }
$move=Move-ResearchRepositoryDirectory $moveRoot $moveSource $blockedTarget
Assert-That (-not $move.success -and $move.error -eq 'directory_rename_failed' -and $move.attempts -eq 1 -and $script:directoryMoveCalls -eq 1 -and $move.failures[0].nativeCode -eq 112) 'non-sharing IO failure is not retried'
Rejects { Move-ResearchRepositoryDirectory $moveRoot $moveSource (Join-Path $fixture 'outside') } 'directory rename rechecks cache containment'
Rejects { Move-ResearchRepositoryDirectory $moveRoot $moveSource (Join-Path $moveTarget 'nested') } 'directory rename requires same parent'
Set-Item function:Move-ResearchDirectory $originalDirectoryMove
[void](Git $work @('init','--initial-branch=main'))
if ($IsWindows) {
    Assert-That ((Git $work @('config','--get','core.longpaths')) -ceq 'true' -and -not (Read-ResearchText (Join-Path $work '.git/config')).Contains('longpaths')) 'Windows Git long paths are enabled per invocation without persistent configuration'
}
Set-FixtureGitIdentity $work
Put (Join-Path $work 'readme.txt') 'initial'
[void](Git $work @('add','readme.txt'));[void](Git $work @('commit','-m','initial'))
[void](Git $fixture @('clone','--bare','--',$work,$remote))
$url=([Uri]$remote).AbsoluteUri
$header=Read-ResearchText (Join-Path $ProjectRoot 'app/research/git-clone-header.sh')
Put (Join-Path $source '.git-clone') ($header+"`nclone 'ai-agents/sample' '$url'`nclone 'other/skip' '$url'`nclone 'ai-agents-mem/duplicate' '$url'`n")
Put (Join-Path $source '.git-sources') ($url+"`n")
$entries=Read-ResearchSourceList $settings -Import
Assert-That ($entries.Count -eq 2 -and $entries[0].url -eq $entries[1].url) 'category filtering preserves duplicate identities'
Write-ResearchLists $settings $entries
foreach ($lfExport in @('.git-clone','.git-sources','git-sources.json')) {
    Assert-That (-not ([IO.File]::ReadAllBytes((Join-Path $root $lfExport)) -contains 13)) ('generated source export uses LF: '+$lfExport)
}
Assert-That ((Read-ResearchText (Join-Path $root '.git-clone')).StartsWith($header.TrimEnd())) 'source loader header retained'
$publishedExports=Join-Path $fixture 'published-exports';[void][IO.Directory]::CreateDirectory($publishedExports)
Put (Join-Path $publishedExports '.git-clone') (Read-ResearchText (Join-Path $root '.git-clone'))
Put (Join-Path $publishedExports '.git-sources') (Read-ResearchText (Join-Path $root '.git-sources'))
$publishedSettings=$settings.Clone()
$publishedSettings.SourcesDirectory=$publishedExports
$publishedEntries=Read-ResearchSourceList $publishedSettings -Import
Assert-That ($publishedEntries.Count -eq $entries.Count) 'published clone declarations survive round-trip parsing'
for ($entryIndex=0;$entryIndex -lt $entries.Count;$entryIndex++) {
    Assert-That ($publishedEntries[$entryIndex].id -eq $entries[$entryIndex].id -and $publishedEntries[$entryIndex].sourcePath -eq $entries[$entryIndex].sourcePath -and $publishedEntries[$entryIndex].url -eq $entries[$entryIndex].url) 'published source identity and order retained'
}
Assert-That ((Read-ResearchText (Join-Path $root '.git-sources')) -eq ($url+"`n")) 'published URL list deduplicates shared origins without losing clone identities'
$ownedBefore=Read-ResearchText (Join-Path $root 'git-sources.json')
$ownedEntries=Read-ResearchSourceList $settings
Assert-That ($ownedEntries.Count -eq 2 -and $settings.SourceMode -eq 'owned_configuration') 'repository synchronization reads owned configuration despite external setting'
$fresh=Join-Path $fixture 'fresh-clone';[void][IO.Directory]::CreateDirectory($fresh)
Put (Join-Path $fresh 'git-sources.json') $ownedBefore
$freshSettings=Get-ResearchSettings $fresh
$freshEntries=Read-ResearchSourceList $freshSettings
Assert-That ($freshSettings.SourcesDirectory -eq '' -and $freshEntries.Count -eq 2 -and $freshSettings.GitCache -eq (Join-Path $fresh '.cache/git')) 'fresh checkout reads portable configuration without a parent export'
$freshResult=Invoke-ResearchGitSync -ProjectRoot $fresh -Action lists
Assert-That ($freshResult.sourceMode -eq 'owned_configuration' -and (Read-ResearchText (Join-Path $fresh 'git-sources.json')) -eq $ownedBefore) 'default source task preserves deterministic owned configuration'
$originalDeclarations=Read-ResearchText (Join-Path $source '.git-clone')
$headerSentinel=Join-Path $fixture 'header-must-never-execute'
$legacy="#!/bin/bash`ntouch '$($headerSentinel.Replace('\','/'))'`nclone() { echo ignored; }`nclone 'ai-agents/sample' '$url'`nclone 'ai-agents-mem/duplicate' '$url'`n"
Put (Join-Path $source '.git-clone') $legacy
$legacyResult=Invoke-ResearchGitSync -ProjectRoot $root -Action lists
$publishedLegacy=Read-ResearchText (Join-Path $root '.git-clone')
Assert-That ($legacyResult.sourceMode -eq 'external_declarations' -and $legacyResult.warnings.Count -eq 0 -and $publishedLegacy.StartsWith($header.TrimEnd()) -and -not $publishedLegacy.Contains('header-must-never-execute') -and -not (Test-Path -LiteralPath $headerSentinel) -and (Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore) 'legacy regenerated export imports only declarations and retains owned loader'
$legacySourceUrls=Read-ResearchText (Join-Path $source '.git-sources')
$legacyProjectUrls=Read-ResearchText (Join-Path $root '.git-sources')
$originalImportMove=${function:Move-ResearchListFile}
function Move-ResearchListFile([string]$Source,[string]$Destination) {
    if ([IO.Path]::GetFileName($Destination) -in @('.git-clone','.git-sources')) { throw [UnauthorizedAccessException]::new('fixture protected legacy export') }
    [IO.File]::Move($Source,$Destination,$true)
}
$protectedImport=Invoke-ResearchGitSync -ProjectRoot $root -Action lists
Assert-That ($protectedImport.files.Count -eq 1 -and $protectedImport.files[0] -eq 'git-sources.json' -and (Read-ResearchText (Join-Path $source '.git-clone')) -eq $legacy -and (Read-ResearchText (Join-Path $source '.git-sources')) -eq $legacySourceUrls -and (Read-ResearchText (Join-Path $root '.git-clone')) -eq $publishedLegacy -and (Read-ResearchText (Join-Path $root '.git-sources')) -eq $legacyProjectUrls) 'canonical import never writes external inputs or protected legacy exports'
function Move-ResearchListFile([string]$Source,[string]$Destination) { throw [UnauthorizedAccessException]::new('fixture denied canonical publication') }
Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action lists } 'canonical publication failure is explicit'
Assert-That ((Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore) 'canonical publication failure preserves previous portable configuration'
Set-Item function:Move-ResearchListFile $originalImportMove
Put (Join-Path $source '.git-sources') ''
$emptyAuxiliary=Invoke-ResearchGitSync -ProjectRoot $root -Action lists
Assert-That ($emptyAuxiliary.repositories.Count -eq 2 -and $emptyAuxiliary.warnings -contains 'auxiliary_source_list_empty_or_missing_validated_clone_declarations_used') 'empty auxiliary export imports validated declarations with explicit warning'
$importReceipt=Get-Content -LiteralPath (Join-Path $root '.cache/research/source-import.json') -Raw | ConvertFrom-Json
Assert-That ($importReceipt.warnings.Count -eq 1 -and $importReceipt.sourceMode -eq 'external_declarations') 'import warning retained in local receipt'
$auxiliary=Join-Path $source '.git-sources';$savedAuxiliary=Join-Path $source '.git-sources.saved'
[IO.File]::Move($auxiliary,$savedAuxiliary)
try {
    $missingAuxiliary=Invoke-ResearchGitSync -ProjectRoot $root -Action lists
    Assert-That ($missingAuxiliary.repositories.Count -eq 2 -and $missingAuxiliary.warnings.Count -eq 1) 'missing auxiliary export remains explicit and preserves declared sources'
} finally { [IO.File]::Move($savedAuxiliary,$auxiliary) }
Put (Join-Path $source '.git-sources') "https://example.invalid/different`n"
Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action lists } 'nonempty auxiliary disagreement rejects import'
Assert-That ((Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore) 'disagreement preserves previous owned configuration'
Put (Join-Path $source '.git-sources') ($url+"`n")
$badDeclarations=@(
    "clone 'AI-AGENTS/sample' '$url'",
    "clone 'ai-agents/../escape' '$url'",
    "clone 'ai-agents/sample' 'https://user@example.invalid/repo'",
    "clone 'ai-agents/sample' 'https://example.invalid/repo?key=fixture'",
    "clone 'ai-agents/sample' '$url'; echo unexpected",
    "clone 'ai-agents/sample' $url",
    "clone 'ai-agents/sample' '$url'`necho unexpected",
    "clone 'ai-agents/sample' '$url'`nclone 'ai-agents/xx-2401-sample' '$url'"
)
foreach ($declaration in $badDeclarations) {
    Put (Join-Path $source '.git-clone') ("#!/bin/bash`n"+$declaration+"`n")
    Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action lists } 'malformed or conflicting import is rejected'
    Assert-That ((Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore -and (Read-ResearchText (Join-Path $root '.git-clone')) -eq $publishedLegacy) 'invalid import preserves owned configuration and generated clone script'
}
Put (Join-Path $source '.git-clone') $originalDeclarations
Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action lists -Category 'AI-AGENTS' } 'CLI category requires canonical casing'
foreach ($badConfig in @('{"schemaVersion":1,"schemaVersion":1,"repositories":[]}','{"schemaVersion":1,"repositories":[],"extra":true}','{"schemaVersion":1,"repositories":[{"category":"ai-agents","name":"../escape","url":"https://example.invalid/repo"}]}','{"schemaVersion":1,"repositories":[{"category":"ai-agents","name":"xx-2401-sample","url":"https://example.invalid/repo"}]}','{"schemaVersion":1,"repositories":[{"category":"ai-agents","name":5,"url":"https://example.invalid/repo"}]}','{"schemaVersion":1,"repositories":[{"category":"ai-agents","name":"sample","url":"https://example.invalid/repo","command":"unexpected"}]}')) {
    Put (Join-Path $fresh 'git-sources.json') $badConfig
    Rejects { Read-ResearchSourceList $freshSettings } 'owned configuration rejects malformed schema and unsafe identity'
}
Put (Join-Path $fresh 'git-sources.json') $ownedBefore
$before=Read-ResearchText (Join-Path $root '.git-clone')
$originalMove=${function:Move-ResearchListFile}
function Move-ResearchListFile([string]$Source,[string]$Destination) { if ($Destination.EndsWith('.git-sources')) { throw 'fixture_second_write_failure' }; [IO.File]::Move($Source,$Destination,$true) }
Rejects { Write-ResearchLists $settings @($entries[0]) } 'list pair fails transactionally'
Assert-That ((Read-ResearchText (Join-Path $root '.git-clone')) -eq $before) 'first list rolled back'
Assert-That ((Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore) 'failed derived export does not replace owned configuration'
Set-Item function:Move-ResearchListFile $originalMove
$originalListMoveOnce=${function:Move-ResearchListFileOnce};$script:listMoveCalls=0
function Move-ResearchListFileOnce([string]$Source,[string]$Destination) {
    $script:listMoveCalls++
    if ($script:listMoveCalls -eq 1) { throw [IO.IOException]::new('injected sharing violation',-2147024864) }
    [IO.File]::Move($Source,$Destination,$true)
}
Write-ResearchLists $settings $entries
Assert-That ($script:listMoveCalls -eq 4 -and (Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore) 'atomic source publication retries one sharing violation without losing declarations'
$script:listMoveCalls=0
function Move-ResearchListFileOnce([string]$Source,[string]$Destination) { $script:listMoveCalls++;throw [UnauthorizedAccessException]::new('injected denied publication') }
Rejects { Write-ResearchLists $settings @($entries[0]) } 'permanent publication denial is reported'
Assert-That ($script:listMoveCalls -eq 4 -and (Read-ResearchText (Join-Path $root 'git-sources.json')) -eq $ownedBefore -and (Read-ResearchText (Join-Path $root '.git-clone')) -eq $before) 'publication denial stops after four attempts and preserves owned files'
Set-Item function:Move-ResearchListFileOnce $originalListMoveOnce
$now=[DateTimeOffset]::UtcNow
# Canonical IDs are case-folded independently of display names and physical paths.
$caseRoot=Join-Path $fixture 'case-id-project';$caseSource=Join-Path $fixture 'case-id-source'
foreach ($directory in @($caseRoot,$caseSource)) { [void][IO.Directory]::CreateDirectory($directory) }
Put (Join-Path $caseRoot '.env') "TEAMAGENT_GIT_SOURCES_DIR=../case-id-source`nTEAMAGENT_GIT_CACHE=cache`n"
$caseDeclaration="clone 'ai-gen/YuE2-Studio' '$url'`n"
Put (Join-Path $caseSource '.git-clone') $caseDeclaration
Put (Join-Path $caseSource '.git-sources') ($url+"`n")
$caseSettings=Get-ResearchSettings $caseRoot
$caseImport=Invoke-ResearchGitSync -ProjectRoot $caseRoot -Action lists
$caseConfig=Read-ResearchText (Join-Path $caseRoot 'git-sources.json')
$caseOwned=Read-ResearchSourceList $caseSettings
Assert-That ($caseImport.repositories.Count -eq 1 -and $caseImport.repositories[0].id -ceq 'ai-gen--yue2-studio' -and $caseImport.repositories[0].name -ceq 'YuE2-Studio' -and $caseImport.repositories[0].sourcePath -ceq 'ai-gen/YuE2-Studio') 'uppercase declaration has canonical lowercase ID while preserving display and cache spelling'
Assert-That ($caseOwned.Count -eq 1 -and $caseOwned[0].id -ceq 'ai-gen--yue2-studio' -and $caseOwned[0].name -ceq 'YuE2-Studio' -and $caseOwned[0].sourcePath -ceq 'ai-gen/YuE2-Studio' -and $caseConfig.Contains('YuE2-Studio') -and (Read-ResearchText (Join-Path $caseSource '.git-clone')) -ceq $caseDeclaration) 'owned configuration round trip preserves name and source path case without rewriting the export'
$caseRow=Invoke-ResearchRepository $caseOwned[0] $null $caseSettings $now '' '' 15
Assert-That ($caseRow.status -eq 'cloned' -and $caseRow.id -ceq 'ai-gen--yue2-studio' -and $caseRow.path -ceq 'cache/ai-gen/YuE2-Studio' -and (Find-ResearchRepository $caseOwned[0] $caseRow $caseSettings) -ceq ([IO.Path]::GetFullPath($caseRow.path,$caseRoot))) ('sync and prior checkout matching retain canonical ID and actual uppercase directory: '+$caseRow.status+' '+($caseRow.errors -join ','))
Put (Join-Path $caseSource '.git-clone') ($caseDeclaration+"clone 'ai-gen/yue2-studio' '$url'`n")
Rejects { Invoke-ResearchGitSync -ProjectRoot $caseRoot -Action lists } 'case-folded declaration ID collision is rejected before publication'
Assert-That ((Read-ResearchText (Join-Path $caseRoot 'git-sources.json')) -ceq $caseConfig) 'case-fold collision preserves previous portable configuration'
Write-ResearchJson (Join-Path $caseRoot 'git-sources.json') @{schemaVersion=1;repositories=@(@{category='ai-gen';name='YuE2-Studio';url=$url},@{category='ai-gen';name='yue2-studio';url=$url})}
Rejects { Read-ResearchSourceList $caseSettings } 'owned configuration rejects differing-case identities instead of choosing a copy'
Put (Join-Path $caseRoot 'git-sources.json') $caseConfig
Put (Join-Path $caseSource '.git-clone') $caseDeclaration
# Parent export categories can change while repository-owned identities remain stable.
$aliasRoot=Join-Path $fixture 'category-alias-project';$aliasSource=Join-Path $fixture 'category-alias-source'
foreach ($directory in @($aliasRoot,$aliasSource)) { [void][IO.Directory]::CreateDirectory($directory) }
Put (Join-Path $aliasRoot '.env') "TEAMAGENT_GIT_SOURCES_DIR=../category-alias-source`nTEAMAGENT_GIT_CACHE=cache`n"
$aliasDeclarations="clone 'ai-get/xx-2401-docling' '$url'`nclone 'ai-get/minipcm-ocr' '$url'`n"
Put (Join-Path $aliasSource '.git-clone') $aliasDeclarations
Put (Join-Path $aliasSource '.git-sources') ($url+"`n")
$aliasSettings=Get-ResearchSettings $aliasRoot
$aliasImported=Read-ResearchSourceList $aliasSettings -Import
Assert-That ($aliasImported.Count -eq 2 -and $aliasImported[0].id -ceq 'ai-query--docling' -and $aliasImported[1].id -ceq 'ai-query--minipcm-ocr' -and $aliasImported[0].sourcePath -ceq 'ai-get/xx-2401-docling' -and $aliasSettings.SourceWarnings.Count -eq 1 -and $aliasSettings.SourceWarnings[0] -eq 'source_category_alias_ai-get_to_ai-query') 'reviewed category alias preserves IDs and records original declarations once'
$aliasImport=Invoke-ResearchGitSync -ProjectRoot $aliasRoot -Action lists
$aliasConfig=Read-ResearchText (Join-Path $aliasRoot 'git-sources.json')
$aliasOwned=Read-ResearchSourceList $aliasSettings
Assert-That ($aliasImport.repositories.Count -eq 2 -and $aliasOwned[1].category -ceq 'ai-query' -and $aliasOwned[1].sourcePath -ceq 'ai-query/minipcm-ocr' -and -not $aliasConfig.Contains('ai-get') -and (Read-ResearchText (Join-Path $aliasSource '.git-clone')) -ceq $aliasDeclarations) 'portable configuration retains canonical categories without rewriting parent exports'
foreach ($declaration in @("clone 'AI-GET/sample' '$url'", "clone 'ai-get/../escape' '$url'", "clone 'ai-get/sample' '$url'`nclone 'ai-query/sample' '$url'")) {
    Put (Join-Path $aliasSource '.git-clone') ($declaration+"`n")
    Rejects { Invoke-ResearchGitSync -ProjectRoot $aliasRoot -Action lists } 'category alias rejects casing traversal and duplicate canonical identity'
    Assert-That ((Read-ResearchText (Join-Path $aliasRoot 'git-sources.json')) -ceq $aliasConfig) 'invalid category alias leaves canonical inventory intact'
}
Put (Join-Path $aliasSource '.git-clone') $aliasDeclarations
$aliasFresh=Join-Path $fixture 'category-alias-fresh';[void][IO.Directory]::CreateDirectory($aliasFresh)
Put (Join-Path $aliasFresh 'git-sources.json') $aliasConfig
$aliasFreshSettings=Get-ResearchSettings $aliasFresh
$aliasFreshEntries=Read-ResearchSourceList $aliasFreshSettings
Assert-That ((Find-ResearchRepository $aliasFreshEntries[1] $null $aliasFreshSettings) -eq (Join-Path $aliasFresh '.cache/git/ai-query/minipcm-ocr')) 'fresh checkout needs no parent export or alias folder'
$aliasParent=Get-ResearchSafePath $aliasSettings.GitCache 'ai-get'
[void][IO.Directory]::CreateDirectory($aliasParent)
$aliasPath=Get-ResearchSafePath $aliasSettings.GitCache 'ai-get/xx-2401-minipcm-ocr'
[void](Git $fixture @('clone','--',$url,$aliasPath))
$aliasEntry=$aliasOwned[1]
$aliasPrior=@{path='cache/ai-query/minipcm-ocr';aliases=@();head=(Git $aliasPath @('rev-parse','HEAD'))}
Assert-That ((Find-ResearchRepository $aliasEntry $aliasPrior $aliasSettings) -eq $aliasPath) 'canonical inventory discovers prefixed checkout in renamed category despite stale prior path'
$aliasRow=Invoke-ResearchRepository $aliasEntry $aliasPrior $aliasSettings $now '' '' 15
$aliasActivePath=Get-ResearchSafePath $aliasSettings.GitCache 'ai-get/minipcm-ocr'
Assert-That ($aliasRow.status -eq 'unchanged' -and $aliasRow.id -ceq 'ai-query--minipcm-ocr' -and $aliasRow.path -ceq 'cache/ai-get/minipcm-ocr' -and $aliasRow.head -eq $aliasPrior.head -and $aliasRow.directoryMove.stage -eq 'lifecycle_rename' -and $aliasRow.directoryMove.result.success -and -not (Test-Path -LiteralPath (Join-Path $aliasSettings.GitCache 'ai-query'))) 'category alias reuses exact Git history and removes stale prefix within the discovered parent'
$aliasOld=Invoke-ResearchRepository $aliasEntry $aliasRow $aliasSettings $now.AddMonths(5) '' '' 15
Assert-That ($aliasOld.lifecycle -eq 'outdated' -and $aliasOld.path -match '^cache/ai-get/xx-[0-9]{4}-minipcm-ocr$' -and $aliasOld.directoryMove.result.success -and $aliasOld.head -eq $aliasPrior.head) 'outdated prefix remains in alias parent without category migration'
$aliasActive=Invoke-ResearchRepository $aliasEntry $aliasOld $aliasSettings $now '' '' 15
Assert-That ($aliasActive.path -ceq 'cache/ai-get/minipcm-ocr' -and $aliasActive.lifecycle -eq 'active' -and $aliasActive.head -eq $aliasPrior.head) 'active alias checkout recovers its unprefixed path without cloning'
Put (Join-Path $aliasActivePath 'local-evidence.txt') 'preserved through category alias'
$aliasDirty=Invoke-ResearchRepository $aliasEntry $aliasActive $aliasSettings $now '' '' 15
Assert-That ($aliasDirty.status -eq 'unchanged_with_local_changes' -and $aliasDirty.dirty -and (Read-ResearchText (Join-Path $aliasActivePath 'local-evidence.txt')) -ceq 'preserved through category alias' -and $null -eq $aliasDirty.recovery) 'alias discovery preserves dirty local evidence without an unnecessary stash'
$aliasCollision=Get-ResearchSafePath $aliasSettings.GitCache 'ai-query/minipcm-ocr'
[void][IO.Directory]::CreateDirectory($aliasCollision)
Put (Join-Path $aliasCollision 'retained-copy.txt') 'do not choose or overwrite either copy'
$aliasRejected=Invoke-ResearchRepository $aliasEntry $aliasActive $aliasSettings $now '' '' 15
Assert-That ($aliasRejected.status -eq 'error' -and $aliasRejected.errors -contains 'repository_alias_collision' -and (Read-ResearchText (Join-Path $aliasCollision 'retained-copy.txt')) -ceq 'do not choose or overwrite either copy' -and (Git $aliasActivePath @('rev-parse','HEAD')) -eq $aliasPrior.head) 'canonical and alias copies fail closed before either is changed'
[IO.Directory]::Move($aliasCollision,(Get-ResearchSafePath $aliasSettings.GitCache 'ai-query/retained-conflicting-copy'))
[void](Git $aliasActivePath @('remote','set-url','origin','https://example.invalid/wrong-source'))
$aliasMismatch=Invoke-ResearchRepository $aliasEntry $aliasActive $aliasSettings $now '' '' 15
Assert-That ($aliasMismatch.status -eq 'error' -and $aliasMismatch.errors -contains 'repository_origin_mismatch' -and (Git $aliasActivePath @('rev-parse','HEAD')) -eq $aliasPrior.head) 'renamed category does not bypass expected origin validation'
[void](Git $aliasActivePath @('remote','set-url','origin',$url))
$aliasLinkRoot=Join-Path $fixture 'category-alias-link';[void][IO.Directory]::CreateDirectory($aliasLinkRoot)
Put (Join-Path $aliasLinkRoot '.env') "TEAMAGENT_GIT_CACHE=cache`n"
$aliasLinkSettings=Get-ResearchSettings $aliasLinkRoot
[void][IO.Directory]::CreateDirectory($aliasLinkSettings.GitCache)
$aliasLink=Join-Path $aliasLinkSettings.GitCache 'ai-get'
[void](New-Item -ItemType $(if ($IsWindows) { 'Junction' } else { 'SymbolicLink' }) -Path $aliasLink -Target $aliasParent)
Rejects { Find-ResearchRepository $aliasEntry $null $aliasLinkSettings } 'category alias lookup rejects redirected roots'
$row=Invoke-ResearchRepository $entries[0] $null $settings $now '' '' 15
Assert-That ($row.status -eq 'cloned' -and $row.dirty -eq $false -and $row.directoryMove.stage -eq 'clone_publication' -and $row.directoryMove.result.success) ('clone repository: '+$row.status+' '+($row.errors -join ','))
$checkout=[IO.Path]::GetFullPath($row.path,$root)
Put (Join-Path $checkout 'untracked.txt') 'local work'
Put (Join-Path $work 'readme.txt') 'advance before stash';[void](Git $work @('commit','-am','advance before stash'));[void](Git $work @('push','--',$remote,'main'))
$dirty=Invoke-ResearchRepository $entries[0] $row $settings $now '' '' 15
Assert-That ($dirty.status -eq 'updated_with_local_changes' -and (Test-Path -LiteralPath (Join-Path $checkout 'untracked.txt')) -and $null -ne $dirty.recovery.stashOid) 'auto stash restores untracked work and retains recovery'
$stashBefore=Git $checkout @('rev-parse','refs/stash')
$journalsBefore=@(Get-ChildItem -LiteralPath (Join-Path $root '.cache/research/recovery') -Filter '*.json').Count
$repeated=Invoke-ResearchRepository $entries[0] $dirty $settings $now '' '' 15
Assert-That ($repeated.status -eq 'unchanged_with_local_changes' -and (Git $checkout @('rev-parse','refs/stash')) -eq $stashBefore -and @(Get-ChildItem -LiteralPath (Join-Path $root '.cache/research/recovery') -Filter '*.json').Count -eq $journalsBefore -and $repeated.recovery.stashOid -eq $dirty.recovery.stashOid) 'already-current dirty sync creates no new stash or journal'
Put (Join-Path $work 'readme.txt') 'advance before optout';[void](Git $work @('commit','-am','advance before optout'));[void](Git $work @('push','--',$remote,'main'))

$settings.Values.TEAMAGENT_GIT_AUTO_STASH='false'
$optout=Invoke-ResearchRepository $entries[0] $dirty $settings $now '' '' 15
Assert-That ($optout.status -eq 'dirty') 'auto stash opt out preserves dirty checkout'
$settings.Values.TEAMAGENT_GIT_AUTO_STASH='true'
[IO.File]::Delete((Join-Path $checkout 'untracked.txt'))
Put (Join-Path $work 'readme.txt') 'upstream update';[void](Git $work @('commit','-am','upstream update'));[void](Git $work @('push','--',$remote,'main'))
# A failed fast-forward command does not establish divergent history. Keep its
# bounded diagnostic receipt while preserving the branch, existing stash and data.
$failureHead,$failureStash=Get-FixtureGitRefPair $checkout 'HEAD' 'refs/stash'
$originalFailureGit=(Get-Item function:Invoke-ResearchGit).ScriptBlock
function Invoke-ResearchGit([string]$Directory,[string[]]$Arguments,[string]$InputText='',[int]$TimeoutSeconds=120,[switch]$ReadOnly) {
    if ($Arguments.Count -gt 0 -and $Arguments[0] -eq 'merge') {
        $script:failureMergeCalls++
        return $script:failureMergeResponse
    }
    return & $originalFailureGit $Directory $Arguments $InputText $TimeoutSeconds -ReadOnly:$ReadOnly
}
try {
    foreach ($failure in @(
        @{name='confirmed operational failure';code='fast_forward_operation_failed';outcome='exited';response=@{exitCode=128;stdout="TOKEN=fixture-private-token`n";stderr=("fatal: Unable to create 'private/index.lock': File exists`r`nAuthorization: Bearer fixture-private-header`r`nhttps://fixture-user:fixture-password@example.invalid/path?key=fixture-query-secret`r`nPRIVATE_DUMP=fixture-private-payload`n"+('private-filter-data '*400));error=''}},
        @{name='timeout or launch uncertainty';code='fast_forward_outcome_uncertain';outcome='timeout-or-launch-failure';response=@{exitCode=-1;stdout='';stderr='';error='process_timeout_or_launch_failure'}},
        @{name='capture limit uncertainty';code='fast_forward_outcome_uncertain';outcome='output-limit';response=@{exitCode=-1;stdout='';stderr='';error='process_output_limit'}}
    )) {
        $script:failureMergeCalls=0;$script:failureMergeResponse=$failure.response
        $failedUpdate=Invoke-ResearchRepository $entries[0] $dirty $settings $now '' '' 15
        $diagnostic=$failedUpdate.recovery.fastForward
        $journal=Read-ResearchText ([IO.Path]::GetFullPath($failedUpdate.recovery.journal,$root))
        Assert-That ($failedUpdate.status -eq 'error' -and $failedUpdate.errors -contains $failure.code -and $diagnostic.outcome -eq $failure.outcome -and $diagnostic.branchDistance.status -eq 'ready' -and $diagnostic.branchDistance.ahead -eq 0 -and $diagnostic.branchDistance.behind -gt 0 -and $script:failureMergeCalls -eq 1) ('fast-forward '+$failure.name+' remains operational and is never retried')
        $expectedRecoveryStatus=if ($failure.response.exitCode -lt 0) {'fast_forward_uncertain'} else {'fast_forward_failed'}
        $afterFailure=Get-FixtureGitRefPair $checkout 'HEAD' 'refs/stash'
        Assert-That ($afterFailure[0] -ceq $failureHead -and $afterFailure[1] -ceq $failureStash -and $failedUpdate.recovery.status -eq $expectedRecoveryStatus -and $failedUpdate.recovery.beforeHead -eq $failureHead) ('fast-forward '+$failure.name+' retains original HEAD stash and failure journal')
        Assert-That ($journal.Length -lt 4096 -and -not $journal.Contains("`r") -and $journal -notmatch 'fixture-private|fixture-user|fixture-password|fixture-query-secret|private-filter-data|PRIVATE_DUMP|Authorization:') ('fast-forward '+$failure.name+' journal is bounded LF and contains no raw credentials or payload')
        if ($failure.response.exitCode -ge 0) {
            $expectedStderr=[Text.Encoding]::UTF8.GetBytes($failure.response.stderr)
            Assert-That ($diagnostic.exitCode -eq 128 -and $diagnostic.captureComplete -and $diagnostic.stderrBytes -eq $expectedStderr.Length -and $diagnostic.stderrSha256 -ceq [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($expectedStderr)).ToLowerInvariant() -and $diagnostic.signals.Count -eq 1 -and $diagnostic.signals[0].code -eq 'lock_unavailable') 'confirmed Git rejection retains exact bounded output identity and actionable lock classification'
        } else {
            Assert-That ($null -eq $diagnostic.exitCode -and -not $diagnostic.captureComplete) 'uncertain command does not invent native exit or complete capture'
        }
    }
} finally { Set-Item function:Invoke-ResearchGit $originalFailureGit }
$updated=Invoke-ResearchRepository $entries[0] $dirty $settings $now '' '' 15
Assert-That ($updated.status -eq 'updated' -and (Read-ResearchText (Join-Path $checkout 'readme.txt')) -eq 'upstream update') 'fast forward update'
Set-FixtureGitIdentity $checkout
Put (Join-Path $checkout 'local.txt') 'local commit';[void](Git $checkout @('add','local.txt'));[void](Git $checkout @('commit','-m','local commit'))
$localHead=Git $checkout @('rev-parse','HEAD')
Put (Join-Path $work 'readme.txt') 'divergent';[void](Git $work @('commit','-am','divergent'));[void](Git $work @('push','--',$remote,'main'))
$diverged=Invoke-ResearchRepository $entries[0] $updated $settings $now '' '' 15
Assert-That ($diverged.status -eq 'diverged' -and $diverged.errors -contains 'local_commits_preserved' -and $diverged.errors -notcontains 'fast_forward_operation_failed' -and (Git $checkout @('rev-parse','HEAD')) -eq $localHead) 'proven divergence preserves local history without calling it an operational failure'
$detachedEntry=@{id='ai-agents--detached';category='ai-agents';name='detached';sourcePath='ai-agents/detached';url=$url}
$detachedRow=Invoke-ResearchRepository $detachedEntry $null $settings $now '' '' 15
$detachedPath=[IO.Path]::GetFullPath($detachedRow.path,$root)
Set-FixtureGitIdentity $detachedPath
[void](Git $detachedPath @('checkout','--detach',$detachedRow.head))
Put (Join-Path $detachedPath 'detached-only.txt') 'preserve in recovery branch'
[void](Git $detachedPath @('add','detached-only.txt'));[void](Git $detachedPath @('commit','-m','detached evidence'))
$detachedHead=Git $detachedPath @('rev-parse','HEAD')
Put (Join-Path $detachedPath 'detached-untracked.txt') 'restore local file'
$recovered=Invoke-ResearchRepository $detachedEntry $detachedRow $settings $now '' '' 15
Assert-That ($recovered.status -eq 'updated_with_local_changes' -and (Git $detachedPath @('symbolic-ref','--short','HEAD')) -eq 'main') ('detached selects remote default: '+$recovered.status+' '+($recovered.errors -join ','))
Assert-That ((Git $detachedPath @('rev-parse',$recovered.recovery.recoveryRef)) -eq $detachedHead -and -not (Test-Path -LiteralPath (Join-Path $detachedPath 'detached-only.txt'))) 'exact detached commit preserved without replay'
Assert-That ((Read-ResearchText (Join-Path $detachedPath 'detached-untracked.txt')) -eq 'restore local file' -and (Test-Path -LiteralPath ([IO.Path]::GetFullPath($recovered.recovery.journal,$root)))) 'detached local change and journal retained'
$untrackedEntry=@{id='ai-agents--untracked';category='ai-agents';name='untracked';sourcePath='ai-agents/untracked';url=$url}
$untrackedRow=Invoke-ResearchRepository $untrackedEntry $null $settings $now '' '' 15
$untrackedPath=[IO.Path]::GetFullPath($untrackedRow.path,$root)
Set-FixtureGitIdentity $untrackedPath
[void](Git $untrackedPath @('checkout','--no-track','-b','internal-staging'))
Put (Join-Path $untrackedPath 'staging-only.txt') 'preserve original staging branch'
[void](Git $untrackedPath @('add','staging-only.txt'));[void](Git $untrackedPath @('commit','-m','local staging evidence'))
$stagingHead=Git $untrackedPath @('rev-parse','HEAD')
$blockedStaging=Invoke-ResearchRepository $untrackedEntry $untrackedRow $settings $now '' '' 15
Assert-That ($blockedStaging.status -eq 'blocked' -and $blockedStaging.errors -contains 'untracked_branch' -and (Git $untrackedPath @('symbolic-ref','--short','HEAD')) -eq 'internal-staging') 'untracked local branch remains unchanged by default'
$settings.UsePrimaryBranch=$true
$primaryRow=Invoke-ResearchRepository $untrackedEntry $blockedStaging $settings $now '' '' 15
$settings.UsePrimaryBranch=$false
$stagingUpstream=Invoke-ResearchGit $untrackedPath @('rev-parse','--symbolic-full-name','internal-staging@{upstream}') '' 15
Assert-That ($primaryRow.status -eq 'updated' -and (Git $untrackedPath @('symbolic-ref','--short','HEAD')) -eq 'main' -and $primaryRow.recovery.sourceBranch -eq 'internal-staging') ('explicit primary option switches safely: '+$primaryRow.status+' '+($primaryRow.errors -join ','))
$stagingRefs=Get-FixtureGitRefPair $untrackedPath 'internal-staging' $primaryRow.recovery.recoveryRef
Assert-That ($stagingRefs[0] -eq $stagingHead -and $stagingRefs[1] -eq $stagingHead -and $stagingUpstream.exitCode -ne 0 -and -not (Test-Path -LiteralPath (Join-Path $untrackedPath 'staging-only.txt'))) 'original untracked branch, exact commit and upstream config preserved'

$missingEntry=@{id='ai-agents--missing-upstream';category='ai-agents';name='missing-upstream';sourcePath='ai-agents/missing-upstream';url=$url}
$missingRow=Invoke-ResearchRepository $missingEntry $null $settings $now '' '' 15
$missingPath=[IO.Path]::GetFullPath($missingRow.path,$root)
[void](Git $missingPath @('checkout','--no-track','-b','retired-staging'))
[void](Git $missingPath @('config','branch.retired-staging.remote','origin'))
[void](Git $missingPath @('config','branch.retired-staging.merge','refs/heads/retired-staging'))
[void](Git $missingPath @('symbolic-ref','refs/remotes/origin/HEAD','refs/remotes/origin/retired-staging'))
$missingHead=Git $missingPath @('rev-parse','HEAD')
$blockedMissing=Invoke-ResearchRepository $missingEntry $missingRow $settings $now '' '' 15
Assert-That ($blockedMissing.status -eq 'blocked' -and $blockedMissing.errors -contains 'upstream_branch_missing' -and (Git $missingPath @('symbolic-ref','--short','HEAD')) -eq 'retired-staging') 'missing configured upstream remains blocked by default'
$settings.UsePrimaryBranch=$true
[void](Git $missingPath @('config','branch.retired-staging.remote','another-remote'))
$blockedOther=Invoke-ResearchRepository $missingEntry $blockedMissing $settings $now '' '' 15
Assert-That ($blockedOther.status -eq 'blocked' -and $blockedOther.errors -contains 'tracking_remote_not_origin') 'primary opt-in refuses unresolved tracking for another remote'
[void](Git $missingPath @('config','branch.retired-staging.remote','origin'))
$branchConfigBefore=Read-ResearchText (Join-Path $missingPath '.git/config')
$primaryMissing=Invoke-ResearchRepository $missingEntry $blockedMissing $settings $now '' '' 15
$settings.UsePrimaryBranch=$false
Assert-That ($primaryMissing.status -eq 'updated' -and (Git $missingPath @('symbolic-ref','--short','HEAD')) -eq 'main' -and $primaryMissing.recovery.reason -eq 'missing_upstream_primary_opt_in' -and $primaryMissing.recovery.sourceUpstream -eq 'refs/remotes/origin/retired-staging') ('primary opt-in recovers missing origin upstream using authoritative default: '+$primaryMissing.status+' '+($primaryMissing.errors -join ','))
$missingRefs=Get-FixtureGitRefPair $missingPath 'retired-staging' $primaryMissing.recovery.recoveryRef
Assert-That ($missingRefs[0] -eq $missingHead -and $missingRefs[1] -eq $missingHead -and (Read-ResearchText (Join-Path $missingPath '.git/config')) -eq $branchConfigBefore) 'missing-upstream recovery preserves original branch and exact config'

$conflictEntry=@{id='ai-agents--conflict';category='ai-agents';name='conflict';sourcePath='ai-agents/conflict';url=$url}
$conflictRow=Invoke-ResearchRepository $conflictEntry $null $settings $now '' '' 15
$conflictPath=[IO.Path]::GetFullPath($conflictRow.path,$root)
Put (Join-Path $conflictPath 'readme.txt') 'local choice'
Put (Join-Path $work 'readme.txt') 'upstream choice'
[void](Git $work @('commit','-am','upstream conflicting change'));[void](Git $work @('push','--',$remote,'main'))
$conflicted=Invoke-ResearchRepository $conflictEntry $conflictRow $settings $now '' '' 15
Assert-That ($conflicted.status -eq 'stash_conflict' -and $conflicted.dirty -and (Git $conflictPath @('cat-file','-t',$conflicted.recovery.stashOid)) -eq 'commit') ('stash conflict keeps exact recovery object: '+$conflicted.status+' '+($conflicted.errors -join ','))
Assert-That ((Read-ResearchText (Join-Path $conflictPath 'readme.txt')).Contains('local choice')) 'stash conflict keeps local content visible'

$oldCommitDate=$env:GIT_COMMITTER_DATE
try {
    $env:GIT_COMMITTER_DATE=$now.AddMonths(-6).ToString('o')
    Put (Join-Path $work 'readme.txt') 'old upstream head'
    [void](Git $work @('commit','-am','old dated upstream head'))
} finally { $env:GIT_COMMITTER_DATE=$oldCommitDate }
[void](Git $work @('push','--',$remote,'main'))
$oldRow=Invoke-ResearchRepository $entries[1] $null $settings $now '' '' 15
Assert-That ($oldRow.lifecycle -eq 'outdated' -and $oldRow.path.Contains('/xx-'+$now.AddMonths(-6).ToString('yyMM')+'-duplicate')) ('outdated prefix rename: '+$oldRow.status+' '+($oldRow.errors -join ',')+' '+($oldRow.directoryMove | ConvertTo-Json -Depth 6 -Compress))
Put (Join-Path $work 'readme.txt') 'fresh upstream again'
[void](Git $work @('commit','-am','fresh upstream again'));[void](Git $work @('push','--',$remote,'main'))
$restored=Invoke-ResearchRepository $entries[1] $oldRow $settings $now '' '' 15
Assert-That ($restored.lifecycle -eq 'active' -and $restored.path.EndsWith('/ai-agents-mem/duplicate') -and $null -ne $restored.previousPath) 'fresh upstream restores active name'

$backupRemote=Join-Path $fixture 'backup.git'
[void](Git $fixture @('init','--bare',$backupRemote))
# A branch present only under origin must survive alongside divergent local history.
[void](Git $checkout @('update-ref','refs/remotes/origin/feature',$updated.head))
[void](Git $checkout @('tag','fixture-tag'))
$backup=Push-ResearchBackupHistory $checkout ([Uri]$backupRemote).AbsoluteUri 15
Assert-That ($backup.status -eq 'complete' -and $backup.verifiedRefs -ge 5) ('backup verifies local, upstream, tags and HEAD: '+$backup.reason)
$backupRefs=Git $fixture @('ls-remote','--refs',([Uri]$backupRemote).AbsoluteUri)
Assert-That ($backupRefs.Contains('refs/heads/upstream/feature') -and $backupRefs.Contains('refs/heads/local/main') -and $backupRefs.Contains('refs/tags/fixture-tag')) 'backup keeps upstream-only branch'
$oldApi=${function:Invoke-ResearchGitHub}
function Invoke-ResearchGitHub { return @{status=200;data=@{id=1;private=$true;owner=@{login='fixture'}}} }
$collision=Invoke-ResearchBackup @{url='https://github.com/example/repo'} $checkout $settings 'fixture-not-a-token' 'fixture' $null 15
Assert-That ($collision.status -eq 'blocked') 'unknown private backup destination rejected'
$oldPush=${function:Push-ResearchBackupHistory}
$script:fakeCreateCalls=0
function Invoke-ResearchGitHub {
    param([string]$Endpoint,[string]$Token,[string]$Method='GET',[object]$Body=$null)
    if ($Method -eq 'GET') { return @{status=404;data=$null} }
    Assert-That ($Endpoint -eq '/user/repos' -and $Body.private -eq $true) 'backup API creation is private'
    $script:fakeCreateCalls++
    return @{status=201;data=@{id=22;private=$true;owner=@{login='fixture'}}}
}
function Push-ResearchBackupHistory { return @{status='complete';reason='git_refs_verified';verifiedRefs=3;limitations=@()} }
$createdBackup=Invoke-ResearchBackup @{url='https://github.com/example/repo'} $checkout $settings 'fixture-not-a-token' 'fixture' $null 15
Assert-That ($createdBackup.status -eq 'complete' -and $createdBackup.createdBy -eq 'teamagent-research' -and $script:fakeCreateCalls -eq 1) 'backup ownership recorded after private creation'
function Invoke-ResearchGitHub { return @{status=200;data=@{id=22;private=$true;owner=@{login='fixture'}}} }
$reusedBackup=Invoke-ResearchBackup @{url='https://github.com/example/repo'} $checkout $settings 'fixture-not-a-token' 'fixture' @{backup=$createdBackup} 15
Assert-That ($reusedBackup.status -eq 'complete') 'known private backup ownership may be reused'
Set-Item function:Push-ResearchBackupHistory $oldPush

Set-Item function:Invoke-ResearchGitHub $oldApi
$statePath=Join-Path $fixture 'status-state.json'
Write-ResearchJson $statePath @{schemaVersion=1;repositories=@($diverged)}
Put (Join-Path $checkout 'fresh-untracked.txt') 'new'
$fresh=Read-ResearchCurrentStatus $statePath $settings 15 $now
Assert-That ($fresh.repositories[0].dirty -eq $true -and $fresh.repositories[0].status -eq 'dirty') 'status inspects fresh untracked files'
[IO.File]::Delete((Join-Path $checkout 'fresh-untracked.txt'))

# Observation publishes fresh local revisions without executing synchronization or consulting sources/accounts.
$observationPath=Join-Path $root '.cache/research/git-state.json'
$observationRow=$diverged.Clone();$observationRow.head=$row.head
$priorRemoteAt=$observationRow.checkedAt
$observeOwnedConfig=Read-ResearchText (Join-Path $root 'git-sources.json')
Write-ResearchJson (Join-Path $root 'git-sources.json') @{schemaVersion=1;repositories=@(@{category=$observationRow.category;name=(Get-ResearchBaseName ($observationRow.id.Substring($observationRow.category.Length+2)) $settings);url=$observationRow.url})}
# Prior state deliberately has no config; the active nondefault cache comes from settings.
$expectedObservationCache=Get-ResearchRelativePath $settings.ProjectRoot $settings.GitCache
Write-ResearchJson $observationPath @{schemaVersion=1;generatedAt=$now.ToString('o');discoveryComplete=$true;repositories=@($observationRow)}
$beforeObservation=Read-ResearchText $observationPath
$beforeCheckoutHead=Git $checkout @('rev-parse','HEAD')
$beforeCheckoutBranch=Git $checkout @('symbolic-ref','--quiet','HEAD')
$beforeCheckoutStashes=Git $checkout @('stash','list','--format=%H')
$observeConfigPath=Join-Path $checkout '.git/config'
$observeConfigBytes=[IO.File]::ReadAllBytes($observeConfigPath)
$observeMonitor=Join-Path $checkout '.git/observe-fsmonitor.sh'
$observeMonitorSentinel=Join-Path $checkout '.git/observe-fsmonitor-invoked'
Put $observeMonitor "#!/bin/sh`nprintf invoked > .git/observe-fsmonitor-invoked`nprintf 'fixture-token\0'`n"
if (-not $IsWindows) { [IO.File]::SetUnixFileMode($observeMonitor,[IO.UnixFileMode]::UserRead -bor [IO.UnixFileMode]::UserWrite -bor [IO.UnixFileMode]::UserExecute) }
[void](Git $checkout @('config','core.fsmonitor',$observeMonitor.Replace('\','/')))
# Positive control: the fixture hook must actually execute without read-only protection.
[void](Git $checkout @('status','--porcelain=v1','--untracked-files=normal'))
Assert-That (Test-Path -LiteralPath $observeMonitorSentinel) 'configured fsmonitor sentinel is executable in ordinary Git status'
[IO.File]::Delete($observeMonitorSentinel)
$observeTrackedPath=Join-Path $checkout 'readme.txt'
$observeTrackedTime=[IO.File]::GetLastWriteTimeUtc($observeTrackedPath)
# Same bytes with a different stat entry make an optional index refresh observable.
[IO.File]::SetLastWriteTimeUtc($observeTrackedPath,$observeTrackedTime.AddMinutes(-5))
$observeIndexPath=Join-Path $checkout '.git/index'
$beforeObserveIndex=[Convert]::ToBase64String([IO.File]::ReadAllBytes($observeIndexPath))
$beforeObserveIndexTime=[IO.File]::GetLastWriteTimeUtc($observeIndexPath)
$remoteReceipt=Join-Path $root '.cache/research/git-sync.json'
Put $remoteReceipt '{"retainedRemoteReceipt":true}'
$oldObserveSources=${function:Read-ResearchSourceList};$oldObserveCredential=${function:Get-ResearchGitHubCredential};$oldObserveRepository=${function:Invoke-ResearchRepository}
$oldObserveCheckout=${function:Read-ResearchCheckout}
function Read-ResearchSourceList { throw 'observation_must_not_read_sources' }
function Get-ResearchGitHubCredential { throw 'observation_must_not_read_credentials' }
function Invoke-ResearchRepository { throw 'observation_must_not_update_checkout' }
try {
    # Publication-only assertions do not need repeated real Git subprocesses.
    function Read-ResearchCheckout([string]$Path,[string]$ExpectedUrl,[int]$TimeoutSeconds,[switch]$ReadOnly) {
        Assert-That $ReadOnly.IsPresent 'status requests explicitly read-only inspection'
        return @{dirty=$true;head=$beforeCheckoutHead;shallow=$false}
    }
    [void](Invoke-ResearchGitSync -ProjectRoot $root -Action status -Now $now.AddHours(1))
    Assert-That ((Read-ResearchText $observationPath) -ceq $beforeObservation) 'status remains nonpublishing'
    Set-Item function:Read-ResearchCheckout $oldObserveCheckout
    Put (Join-Path $checkout 'observe-local.txt') 'local evidence'
    $observation=Invoke-ResearchGitSync -ProjectRoot $root -Action observe -Now $now.AddHours(1)
    $publishedObservation=ConvertFrom-Json (Read-ResearchText $observationPath) -AsHashtable
    Assert-That ($observation.inspectionComplete -and -not $observation.discoveryComplete -and -not $observation.sourceListComplete -and $observation.status -eq 'partial') 'observation reports local-only and dirty coverage truthfully'
    Assert-That ($publishedObservation.repositories[0].head -eq $beforeCheckoutHead -and $publishedObservation.repositories[0].dirty -and $publishedObservation.repositories[0].checkedAt -eq $priorRemoteAt) 'observation records current HEAD while retaining remote observation time'
    Assert-That ($expectedObservationCache -ne '.cache/git' -and $observation.config.gitCache -ceq $expectedObservationCache -and $publishedObservation.config.gitCache -ceq $expectedObservationCache -and $publishedObservation.config.Count -eq 1) 'observation publishes the current nondefault cache root when prior config is missing'
    Assert-That ((Git $checkout @('rev-parse','HEAD')) -eq $beforeCheckoutHead -and (Git $checkout @('symbolic-ref','--quiet','HEAD')) -eq $beforeCheckoutBranch -and (Git $checkout @('stash','list','--format=%H')) -eq $beforeCheckoutStashes -and (Read-ResearchText (Join-Path $checkout 'observe-local.txt')) -eq 'local evidence') 'observation leaves branch, HEAD, stashes and local content unchanged'
    Assert-That (-not (Test-Path -LiteralPath $observeMonitorSentinel)) 'observation never executes configured fsmonitor'
    Assert-That ([Convert]::ToBase64String([IO.File]::ReadAllBytes($observeIndexPath)) -ceq $beforeObserveIndex -and [IO.File]::GetLastWriteTimeUtc($observeIndexPath) -eq $beforeObserveIndexTime) 'observation preserves exact index bytes and write time despite changed tracked-file stat'
    Assert-That ((Read-ResearchText $remoteReceipt) -ceq '{"retainedRemoteReceipt":true}' -and (Read-ResearchText (Join-Path $root '.cache/research/git-observation.json')) -ceq (Read-ResearchText $observationPath)) 'observation preserves remote receipt and publishes matching local evidence'
    Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action observe -Limit 1 } 'observation rejects partial selection'
    Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action observe -UsePrimaryBranch } 'observation rejects checkout mutation flags'
    $observeLock=[IO.File]::Open((Join-Path $root '.cache/research/git-sync.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action observe } 'observation respects the shared maintenance lock' } finally { $observeLock.Dispose() }
    # Exercise the real checkout reader with only its combined identity subprocess failing.
    # Other Git responses are deterministic, so these boundary cases launch no Git processes.
    $oldHeadFailureGit=${function:Invoke-ResearchGit}
    function Invoke-ResearchGit([string]$Directory,[string[]]$Arguments,[string]$InputText='',[int]$TimeoutSeconds=120,[switch]$ReadOnly) {
        if (-not $ReadOnly) { throw 'fixture_inspection_must_be_read_only' }
        $script:observeQueryCalls++
        switch ($Arguments -join ' ') {
            'remote get-url origin' { return @{exitCode=0;stdout=$observationRow.url;stderr='';error=''} }
            'status --porcelain=v1 --untracked-files=normal --ignore-submodules=none' { return @{exitCode=0;stdout='';stderr='';error=''} }
            'rev-parse --is-shallow-repository --verify HEAD' { $script:observeHeadQueryCalls++;return $script:observeHeadResponse }
            default { throw 'fixture_unexpected_inspection_query' }
        }
    }
    try {
        foreach ($headFailure in @(
            @{name='nonzero exit with stale-looking output';response=@{exitCode=1;stdout=("false`n"+$beforeCheckoutHead+"`n");stderr='fixture failure';error=''}},
            @{name='timeout';response=@{exitCode=-1;stdout='';stderr='';error='process_timeout_or_launch_failure'}},
            @{name='malformed successful response';response=@{exitCode=0;stdout='not-a-commit';stderr='';error=''}}
        )) {
            $script:observeQueryCalls=0;$script:observeHeadQueryCalls=0;$script:observeHeadResponse=$headFailure.response
            $headFailureObservation=Invoke-ResearchGitSync -ProjectRoot $root -Action observe -Now $now.AddHours(2)
            $headFailurePublished=ConvertFrom-Json (Read-ResearchText $observationPath) -AsHashtable
            Assert-That ($script:observeQueryCalls -eq 3 -and $script:observeHeadQueryCalls -eq 1 -and $headFailureObservation.status -eq 'partial' -and $headFailurePublished.status -eq 'partial' -and $headFailurePublished.repositories[0].status -eq 'inspection_failed' -and $null -eq $headFailurePublished.repositories[0].head -and $null -eq $headFailurePublished.repositories[0].dirty -and $null -eq $headFailurePublished.repositories[0].shallow) ('HEAD '+$headFailure.name+' publishes incomplete inspection without a stale revision')
        }
    } finally { Set-Item function:Invoke-ResearchGit $oldHeadFailureGit }
    function Read-ResearchCheckout { throw 'injected_local_inspection_failure' }
    $failedObservation=Invoke-ResearchGitSync -ProjectRoot $root -Action observe -Now $now.AddHours(2)
    Assert-That ($failedObservation.repositories[0].status -eq 'inspection_failed' -and $null -eq $failedObservation.repositories[0].head -and $null -eq $failedObservation.repositories[0].dirty -and $null -eq $failedObservation.repositories[0].shallow) 'failed inspection cannot reuse an older verified HEAD'
    function Read-ResearchCheckout([string]$Path,[string]$ExpectedUrl,[int]$TimeoutSeconds,[switch]$ReadOnly) {
        Assert-That $ReadOnly.IsPresent 'publication retry requests explicitly read-only inspection'
        return @{dirty=$true;head=$beforeCheckoutHead;shallow=$false}
    }
    Write-ResearchJson $observationPath @{schemaVersion=1;generatedAt=$now.ToString('o');discoveryComplete=$true;config=@{gitCache='stale-cache';usePrimaryBranch=$true};repositories=@($observationRow)}
    $configuredObservation=Invoke-ResearchGitSync -ProjectRoot $root -Action observe -Now $now.AddHours(3)
    $configuredPublished=ConvertFrom-Json (Read-ResearchText $observationPath) -AsHashtable
    Assert-That ($configuredObservation.config.gitCache -ceq $expectedObservationCache -and $configuredPublished.config.gitCache -ceq $expectedObservationCache -and $configuredPublished.config.Count -eq 1 -and -not $configuredPublished.discoveryComplete -and -not $configuredPublished.sourceListComplete -and $configuredPublished.repositories[0].checkedAt -eq $priorRemoteAt) 'observation replaces stale cache metadata with active settings without carrying old sync options or refreshing remote evidence'
    $oldObserveWriter=${function:Write-ResearchJson};$beforeFailedPublication=Read-ResearchText $observationPath
    function Write-ResearchJson([string]$Path,[object]$Value) {
        if ($Path -eq $observationPath) { throw 'injected_observation_publication_failure' }
        & $oldObserveWriter $Path $Value
    }
    try { Rejects { Invoke-ResearchGitSync -ProjectRoot $root -Action observe } 'observation publication errors are explicit' } finally { Set-Item function:Write-ResearchJson $oldObserveWriter }
    Assert-That ((Read-ResearchText $observationPath) -ceq $beforeFailedPublication) 'failed publication retains prior analysis input'
} finally {
    Put (Join-Path $root 'git-sources.json') $observeOwnedConfig
    Set-Item function:Read-ResearchSourceList $oldObserveSources
    Set-Item function:Get-ResearchGitHubCredential $oldObserveCredential
    Set-Item function:Invoke-ResearchRepository $oldObserveRepository
    Set-Item function:Read-ResearchCheckout $oldObserveCheckout
    [IO.File]::WriteAllBytes($observeConfigPath,$observeConfigBytes)
    [IO.File]::SetLastWriteTimeUtc($observeTrackedPath,$observeTrackedTime)
    [IO.File]::Delete((Join-Path $checkout 'observe-local.txt'))
    [IO.File]::Delete($observeMonitor)
    [IO.File]::Delete($observeMonitorSentinel)
}

$first=Get-ResearchMissingEvidence $null 'not_found_or_inaccessible' $now
$early=Get-ResearchMissingEvidence @{availabilityEvidence=$first} 'not_found_or_inaccessible' $now.AddHours(23)
$confirmed=Get-ResearchMissingEvidence @{availabilityEvidence=$first} 'not_found_or_inaccessible' $now.AddHours(25)
Assert-That (-not $early.confirmed -and $confirmed.confirmed) 'inaccessibility requires independent spaced observations'
Assert-That (-not (Get-ResearchMissingEvidence @{availabilityEvidence=$first} 'unknown' $now.AddDays(2)).confirmed) 'transient failure cannot establish removal'
$missingStatePath=Join-Path $fixture 'missing-evidence-state.json'
$missingRow=@{id=$row.id;category=$row.category;url=$row.url;path=$row.path;availabilityEvidence=$first}
Write-ResearchJson $missingStatePath @{schemaVersion=1;repositories=@($missingRow)}
$reloadedMissing=(Get-ResearchPriorState $missingStatePath $settings)[0]
$roundTripMissing=Get-ResearchMissingEvidence $reloadedMissing 'not_found_or_inaccessible' $now.AddHours(25)
Assert-That ($roundTripMissing.confirmed -and $roundTripMissing.observations -eq 2 -and [DateTimeOffset]::Parse($roundTripMissing.firstMissingAt) -eq $now) 'missing evidence survives real state write/read and retains the first instant'
foreach ($firstValue in @($now,$now.UtcDateTime,$now.LocalDateTime,$now.ToString('o'),$now.ToOffset([TimeSpan]::FromHours(-7)).ToString('o'))) {
    $typedMissing=Get-ResearchMissingEvidence @{availabilityEvidence=@{firstMissingAt=$firstValue;observations=3}} 'not_found_or_inaccessible' $now.AddHours(25)
    Assert-That ($typedMissing.confirmed -and $typedMissing.observations -eq 4 -and [DateTimeOffset]::Parse($typedMissing.firstMissingAt) -eq $now) 'typed or offset timestamp preserves its instant across PowerShell date representations'
}
foreach ($invalidFirst in @('not-a-date','2026-10-24T10:00:00',[DateTime]::SpecifyKind($now.DateTime,[DateTimeKind]::Unspecified),$now.AddDays(3),17,@{date=$now})) {
    $invalidMissing=Get-ResearchMissingEvidence @{availabilityEvidence=@{firstMissingAt=$invalidFirst;observations=3}} 'not_found_or_inaccessible' $now.AddHours(25)
    Assert-That (-not $invalidMissing.confirmed -and $invalidMissing.observations -eq 1) 'invalid, unspecified or future timestamp cannot establish removal'
}
$oldCredential=${function:Get-ResearchGitHubCredential}
function Get-ResearchGitHubCredential { return '' }
Put (Join-Path $source '.git-clone') 'incomplete regenerated export'
$limited=Invoke-ResearchGitSync -ProjectRoot $root -Action sync -Limit 1 -Concurrency 2 -TimeoutSeconds 15 -Now $now
Assert-That (-not $limited.discoveryComplete -and $limited.sourceListComplete -and $limited.status -eq 'partial' -and $limited.repositories.Count -eq 2) 'limited run reports incomplete coverage'
Put (Join-Path $source '.git-clone') ($header+"`nclone 'ai-agents-mem/duplicate' '$url'`n")
[void](Invoke-ResearchGitSync -ProjectRoot $root -Action lists)
$retained=Invoke-ResearchGitSync -ProjectRoot $root -Action sync -Concurrency 2 -TimeoutSeconds 15 -Now $now
$unlisted=@($retained.repositories | Where-Object { $_.id -eq 'ai-agents--sample' })
Assert-That ($retained.discoveryComplete -and $retained.repositories.Count -eq 2 -and $unlisted.Count -eq 1 -and -not $unlisted[0].listed -and $unlisted[0].listStatus -eq 'source_list_removed') 'removed list entry retained and checked'
$targeted=Invoke-ResearchGitSync -ProjectRoot $root -Action sync -Repository 'ai-agents-mem--duplicate' -Concurrency 1 -TimeoutSeconds 15 -Now $now.AddHours(1)
$preserved=@($targeted.repositories | Where-Object { $_.id -eq 'ai-agents--sample' })
Assert-That (-not $targeted.discoveryComplete -and -not $preserved[0].checkedThisRun -and $preserved[0].status -eq $unlisted[0].status -and $preserved[0].checkedAt -eq $unlisted[0].checkedAt) 'targeted run preserves skipped outcomes and observation time'

Set-Item function:Get-ResearchGitHubCredential $oldCredential

$bash=Get-Command bash -CommandType Application -ErrorAction SilentlyContinue | Where-Object { $_.Source -like '*Git*' } | Select-Object -First 1
$bashPath=if ($null -ne $bash) { $bash.Source } elseif (Test-Path -LiteralPath 'C:/Program Files/Git/bin/bash.exe') { 'C:/Program Files/Git/bin/bash.exe' } else { '' }
if ($bashPath -eq '') { throw 'fixture_bash_required' }
$loader=Join-Path $fixture 'loader';[void][IO.Directory]::CreateDirectory($loader)
$loaderProbe='printf ''fixture_hooks_path=%s\n'' "$(git -c "core.hooksPath=$git_null_device" config --get core.hooksPath)"'
$loaderDeclaration=$header+"`nclone 'ai-agents/test' '$url'`n"
Put (Join-Path $loader '.git-clone') ($loaderDeclaration+$loaderProbe+"`n")
Put (Join-Path $loader '.env') 'TEAMAGENT_GIT_CACHE=cache with spaces'
$info=[Diagnostics.ProcessStartInfo]::new();$info.FileName=$bashPath;$info.WorkingDirectory=$loader;$info.UseShellExecute=$false;$info.RedirectStandardInput=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true;$info.CreateNoWindow=$true
$info.ArgumentList.Add('--noprofile');$info.ArgumentList.Add('--norc');$info.ArgumentList.Add('./.git-clone')
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and (Test-Path -LiteralPath (Join-Path $loader 'cache with spaces/ai-agents/test/.git'))) ('Bash literal cache clone: '+$bashResult[2])
$nativeNull=if ($IsWindows) { 'NUL' } else { '/dev/null' }
Assert-That ($bashResult[1].Contains('fixture_hooks_path='+$nativeNull)) 'Bash loader selects the native Git null hook device'
Put (Join-Path $loader '.git-clone') $loaderDeclaration
$cache=Join-Path $loader 'cache with spaces/ai-agents'
$base=Get-ResearchSafePath $cache 'test';$renamed=Get-ResearchSafePath $cache 'xx-2501-test'
$loaderMove=Move-ResearchRepositoryDirectory $cache $base $renamed
Assert-That ($loaderMove.success) 'loader fixture publishes the renamed checkout without replacement'
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and -not (Test-Path -LiteralPath $base)) 'Bash reuses renamed checkout'
Put (Join-Path $loader '.git-clone') ($header+"`nclone 'ai-agents/xx-2401-test' '$url'`n")
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and -not (Test-Path -LiteralPath (Join-Path $cache 'xx-2401-test'))) 'Bash stale source prefix does not clone duplicate'
$loaderRestore=Move-ResearchRepositoryDirectory $cache $renamed $base
Assert-That ($loaderRestore.success) 'loader fixture restores the active checkout without replacement'
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0') 'Bash reuses recovered active checkout'
[void](Git $fixture @('clone','--',$url,(Join-Path $cache 'xx-2502-test')))
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -ne '0' -and $bashResult[2].Contains('clone_alias_ambiguous')) 'Bash refuses ambiguous aliases'

$badConfigs=@(
    @{text='TEAMAGENT_GIT_CACHE=$(touch pwned)';errors=@('dotenv_invalid_value')},
    @{text="TEAMAGENT_GIT_CACHE=x`nTEAMAGENT_GIT_CACHE=y";errors=@('dotenv_duplicate_key')},
    @{text=('TEAMAGENT_GIT_CACHE='+('x'*65537));errors=@('dotenv_oversized','dotenv_invalid_value')}
)
for ($caseIndex=0;$caseIndex -lt $badConfigs.Count;$caseIndex++) {
    Put (Join-Path $loader "bad-config-$caseIndex") $badConfigs[$caseIndex].text
}
# Each subshell runs the same loader with a fresh environment and the exact case
# bytes in .env. Only the outer Bash startup is shared. Dotenv remains inert data.
$badDriver=@'
set +e
for case_id in 0 1 2; do
    case_file="bad-config-$case_id"
    [[ -f "$case_file" ]] || exit 90
    case_data=''
    IFS= read -r -d '' case_data < "$case_file"
    [[ $? == 1 && -n "$case_data" ]] || exit 91
    printf '%s' "$case_data" > .env || exit 92
    ( . ./.git-clone )
    printf '%s=%d\n' "$case_id" "$?"
done
'@
$info.ArgumentList[2]='-s'
$bashResult=[TeamagentResearchProcess]::Run($info,($badDriver+"`n"),20000,1048576)
$caseStatuses=$bashResult[1].Split([char]10)
$caseErrors=$bashResult[2].Split([char]10)
Assert-That ($bashResult[0] -ceq '0' -and $caseStatuses.Count -eq ($badConfigs.Count+1) -and $caseStatuses[-1] -ceq '' -and $caseErrors.Count -eq ($badConfigs.Count+1) -and $caseErrors[-1] -ceq '') 'Bash reports every malformed config case with complete LF records'
for ($caseIndex=0;$caseIndex -lt $badConfigs.Count;$caseIndex++) {
    Assert-That ($caseStatuses[$caseIndex] -ceq ($caseIndex.ToString()+'=2') -and $badConfigs[$caseIndex].errors -ccontains $caseErrors[$caseIndex]) 'Bash rejects unsafe or oversized config'
}
Assert-That (-not (Test-Path -LiteralPath (Join-Path $loader 'pwned'))) 'Bash never evaluates dotenv'
Write-ResearchJson (Join-Path $fixture 'example-state.json') @{schemaVersion=1;discoveryComplete=$true;repositories=@($diverged)}
[Console]::Write('FIXTURE_PATH '+(Get-ResearchRelativePath $ProjectRoot $fixture)+"`n")
