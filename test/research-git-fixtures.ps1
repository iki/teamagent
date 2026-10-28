param([string]$ProjectRoot=([IO.Path]::GetFullPath('..',$PSScriptRoot)))
$ErrorActionPreference='Stop'
. (Join-Path $ProjectRoot 'app/research/git-sync.ps1')
$fixture=Join-Path $ProjectRoot ('.cache/research/fixtures-'+[Guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($fixture)
function Assert-That([bool]$Condition,[string]$Name) { if (-not $Condition) { throw ('assertion_failed: '+$Name) }; [Console]::Write('PASS '+$Name+"`n") }
function Put([string]$Path,[string]$Text) { [IO.File]::WriteAllText($Path,$Text,[Text.UTF8Encoding]::new($false)) }
function Git([string]$Directory,[string[]]$Arguments) { $r=Invoke-ResearchGit $Directory $Arguments '' 15; if ($r.exitCode -ne 0) { throw ('fixture_git_failed: '+($Arguments -join ' ')+' '+$r.stderr) }; return $r.stdout.Trim() }
function Rejects([scriptblock]$Operation,[string]$Name) { $rejected=$false; try { & $Operation | Out-Null } catch { $rejected=$true }; Assert-That $rejected $Name }
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
[void](Git $work @('config','commit.gpgsign','false'))
[void](Git $work @('config','user.name','Fixture'))
[void](Git $work @('config','user.email','fixture@example.invalid'))
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
$updated=Invoke-ResearchRepository $entries[0] $dirty $settings $now '' '' 15
Assert-That ($updated.status -eq 'updated' -and (Read-ResearchText (Join-Path $checkout 'readme.txt')) -eq 'upstream update') 'fast forward update'
[void](Git $checkout @('config','commit.gpgsign','false'));[void](Git $checkout @('config','user.name','Fixture'));[void](Git $checkout @('config','user.email','fixture@example.invalid'))
Put (Join-Path $checkout 'local.txt') 'local commit';[void](Git $checkout @('add','local.txt'));[void](Git $checkout @('commit','-m','local commit'))
$localHead=Git $checkout @('rev-parse','HEAD')
Put (Join-Path $work 'readme.txt') 'divergent';[void](Git $work @('commit','-am','divergent'));[void](Git $work @('push','--',$remote,'main'))
$diverged=Invoke-ResearchRepository $entries[0] $updated $settings $now '' '' 15
Assert-That ($diverged.status -eq 'diverged' -and (Git $checkout @('rev-parse','HEAD')) -eq $localHead) 'divergence preserves local history'
$detachedEntry=@{id='ai-agents--detached';category='ai-agents';name='detached';sourcePath='ai-agents/detached';url=$url}
$detachedRow=Invoke-ResearchRepository $detachedEntry $null $settings $now '' '' 15
$detachedPath=[IO.Path]::GetFullPath($detachedRow.path,$root)
[void](Git $detachedPath @('config','commit.gpgsign','false'));[void](Git $detachedPath @('config','user.name','Fixture'));[void](Git $detachedPath @('config','user.email','fixture@example.invalid'))
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
[void](Git $untrackedPath @('config','commit.gpgsign','false'));[void](Git $untrackedPath @('config','user.name','Fixture'));[void](Git $untrackedPath @('config','user.email','fixture@example.invalid'))
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
Assert-That ((Git $untrackedPath @('rev-parse','internal-staging')) -eq $stagingHead -and (Git $untrackedPath @('rev-parse',$primaryRow.recovery.recoveryRef)) -eq $stagingHead -and $stagingUpstream.exitCode -ne 0 -and -not (Test-Path -LiteralPath (Join-Path $untrackedPath 'staging-only.txt'))) 'original untracked branch, exact commit and upstream config preserved'

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
Assert-That ((Git $missingPath @('rev-parse','retired-staging')) -eq $missingHead -and (Git $missingPath @('rev-parse',$primaryMissing.recovery.recoveryRef)) -eq $missingHead -and (Read-ResearchText (Join-Path $missingPath '.git/config')) -eq $branchConfigBefore) 'missing-upstream recovery preserves original branch and exact config'

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
Put (Join-Path $loader '.git-clone') ($header+"`nclone 'ai-agents/test' '$url'`n")
Put (Join-Path $loader '.env') 'TEAMAGENT_GIT_CACHE=cache with spaces'
$info=[Diagnostics.ProcessStartInfo]::new();$info.FileName=$bashPath;$info.WorkingDirectory=$loader;$info.UseShellExecute=$false;$info.RedirectStandardInput=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true;$info.CreateNoWindow=$true
$info.ArgumentList.Add('--noprofile');$info.ArgumentList.Add('--norc');$info.ArgumentList.Add('./.git-clone')
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and (Test-Path -LiteralPath (Join-Path $loader 'cache with spaces/ai-agents/test/.git'))) ('Bash literal cache clone: '+$bashResult[2])
$cache=Join-Path $loader 'cache with spaces/ai-agents'
$base=Get-ResearchSafePath $cache 'test';$renamed=Get-ResearchSafePath $cache 'xx-2501-test'
Move-Item -LiteralPath $base -Destination $renamed
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and -not (Test-Path -LiteralPath $base)) 'Bash reuses renamed checkout'
Put (Join-Path $loader '.git-clone') ($header+"`nclone 'ai-agents/xx-2401-test' '$url'`n")
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0' -and -not (Test-Path -LiteralPath (Join-Path $cache 'xx-2401-test'))) 'Bash stale source prefix does not clone duplicate'
Move-Item -LiteralPath $renamed -Destination $base
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -eq '0') 'Bash reuses recovered active checkout'
[void](Git $fixture @('clone','--',$url,(Join-Path $cache 'xx-2502-test')))
$bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
Assert-That ($bashResult[0] -ne '0' -and $bashResult[2].Contains('clone_alias_ambiguous')) 'Bash refuses ambiguous aliases'

foreach ($bad in @('TEAMAGENT_GIT_CACHE=$(touch pwned)',"TEAMAGENT_GIT_CACHE=x`nTEAMAGENT_GIT_CACHE=y",('TEAMAGENT_GIT_CACHE='+('x'*65537)))) {
  Put (Join-Path $loader '.env') $bad
  $bashResult=[TeamagentResearchProcess]::Run($info,'',20000,1048576)
  Assert-That ($bashResult[0] -ne '0') 'Bash rejects unsafe or oversized config'
}
Assert-That (-not (Test-Path -LiteralPath (Join-Path $loader 'pwned'))) 'Bash never evaluates dotenv'
Write-ResearchJson (Join-Path $fixture 'example-state.json') @{schemaVersion=1;discoveryComplete=$true;repositories=@($diverged)}
[Console]::WriteLine('Fixture evidence: '+(Get-ResearchRelativePath $ProjectRoot $fixture))
