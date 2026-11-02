param([string]$ProjectRoot=([IO.Path]::GetFullPath('..',$PSScriptRoot)),[Parameter(Mandatory)][string]$FixtureRoot)
$ErrorActionPreference='Stop'
. (Join-Path $ProjectRoot 'app/research/git-sync.ps1')
$fixture=Get-ResearchSafePath (Join-Path $ProjectRoot '.tmp') ([IO.Path]::GetRelativePath((Join-Path $ProjectRoot '.tmp'),$FixtureRoot))
if (-not (Test-Path -LiteralPath $fixture -PathType Container)) { throw 'fixture_directory_required' }
function Assert-That([bool]$Condition,[string]$Name) { if (-not $Condition) { throw ('assertion_failed: '+$Name) }; [Console]::Write('PASS '+$Name+"`n") }
function Put([string]$Path,[string]$Text) { Write-ResearchTextFile $Path $Text }
function Git([string]$Directory,[string[]]$Arguments) { $r=Invoke-ResearchGit $Directory $Arguments '' 15; if ($r.exitCode -ne 0) { throw ('fixture_git_failed: '+($Arguments -join ' ')+' '+$r.stderr) }; return $r.stdout.Trim() }
function Rejects([scriptblock]$Operation,[string]$Name) { $rejected=$false; try { & $Operation | Out-Null } catch { $rejected=$true }; Assert-That $rejected $Name }
$now=[DateTimeOffset]'2026-05-01T12:00:00Z'
$work=Join-Path $fixture 'work'
$remote=Join-Path $fixture 'remote.git'
[void][IO.Directory]::CreateDirectory($work)
[void](Git $work @('init','--initial-branch=main'))
[void](Git $work @('config','commit.gpgsign','false'))
[void](Git $work @('config','user.name','Fixture'))
[void](Git $work @('config','user.email','fixture@example.invalid'))
$nativeNull=if ($IsWindows) { 'NUL' } else { '/dev/null' }
Assert-That ((Git $work @('config','--get','core.hooksPath')) -ceq $nativeNull) 'maintenance Git uses the native null hook device'
$readOnlyHookPath=Invoke-ResearchGit $work @('config','--get','core.hooksPath') '' 15 -ReadOnly
Assert-That ($readOnlyHookPath.exitCode -eq 0 -and $readOnlyHookPath.stdout.Trim() -ceq $nativeNull) 'local inspection uses the native null hook device'
$hookPath=Join-Path $work '.git/hooks/pre-commit'
$hookMarker=Join-Path $work '.git/hook-ran.txt'
[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($hookPath))
Put $hookPath "#!/bin/sh`nprintf '%s\n' triggered > .git/hook-ran.txt`nexit 42`n"
if (-not $IsWindows) { [IO.File]::SetUnixFileMode($hookPath,[IO.UnixFileMode]::UserRead -bor [IO.UnixFileMode]::UserWrite -bor [IO.UnixFileMode]::UserExecute) }
$hookProof=Invoke-ResearchGit $work @('-c','core.hooksPath=.git/hooks','hook','run','pre-commit') '' 15
Assert-That ($hookProof.exitCode -eq 42 -and (Test-Path -LiteralPath $hookMarker)) 'owned hook fixture is executable when explicitly enabled'
[IO.File]::Delete($hookMarker)
Put (Join-Path $work 'readme.txt') "initial`n"
[void](Git $work @('add','readme.txt'));[void](Git $work @('commit','-m','initial'))
Assert-That (-not (Test-Path -LiteralPath $hookMarker)) 'maintenance commit suppresses an executable repository hook'
Put (Join-Path $work 'readme.txt') "initial`nsecond`n"
[void](Git $work @('add','readme.txt'));[void](Git $work @('commit','-m','second'))
[void](Git $fixture @('clone','--bare','--',$work,$remote))
$url=([Uri]$remote).AbsoluteUri

$additionalRoot=Join-Path $fixture 'additional-source-project'
$additionalSource=Join-Path $fixture 'additional-source-exports'
foreach ($directory in @($additionalRoot,$additionalSource)) { [void][IO.Directory]::CreateDirectory($directory) }
Put (Join-Path $additionalRoot '.env') "TEAMAGENT_GIT_SOURCES_DIR=../additional-source-exports`n"
$additionalBase='https://github.com/example/parent-source'
$additionalManual='https://github.com/example/explicit-source'
$additionalDeclaration="clone 'ai-agents/parent-source' '$additionalBase'`n"
Put (Join-Path $additionalSource '.git-clone') $additionalDeclaration
Put (Join-Path $additionalSource '.git-sources') ($additionalBase+"`n")
$withoutAdditional=Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists
Assert-That ($withoutAdditional.repositories.Count -eq 1 -and -not ($withoutAdditional.warnings -contains 'explicit_sources_from_git-sources.additional.json')) 'absent supplemental source configuration preserves ordinary import behavior'
$additionalConfig=@{schemaVersion=1;repositories=@(@{category='ai-agents';name='explicit-source';url=$additionalManual})}
Write-ResearchJson (Join-Path $additionalRoot 'git-sources.additional.json') $additionalConfig
$beforeAdditional=Read-ResearchSourceList (Get-ResearchSettings $additionalRoot)
Assert-That ($beforeAdditional.Count -eq 1) 'ordinary inventory reads do not implicitly import supplemental declarations'
$withAdditional=Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists
Assert-That ($withAdditional.repositories.Count -eq 2 -and $withAdditional.warnings -contains 'additional_sources_added_1' -and (Read-ResearchText (Join-Path $additionalSource '.git-clone')) -ceq $additionalDeclaration) 'explicit import retains registered public source absent from parent without modifying exports'
$reimportAdditional=Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists
Assert-That ($reimportAdditional.repositories.Count -eq 2) 'repeated regenerated parent import retains explicit additional source'
Put (Join-Path $additionalSource '.git-clone') ($additionalDeclaration+"clone 'ai-agents/explicit-source' 'https://github.com/EXAMPLE/explicit-source.git'`n")
Put (Join-Path $additionalSource '.git-sources') ($additionalBase+"`n"+$additionalManual+"`n")
$laterParent=Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists
Assert-That ($laterParent.repositories.Count -eq 2 -and $laterParent.warnings -contains 'additional_sources_added_0') 'later parent inclusion deduplicates exact canonical supplemental identity'
$additionalOwned=Read-ResearchText (Join-Path $additionalRoot 'git-sources.json')
foreach ($conflicting in @(
    @{category='ai-agents';name='explicit-source';url='https://github.com/example/different-source'},
    @{category='ai-agents';name='different-name';url=$additionalManual}
)) {
    Write-ResearchJson (Join-Path $additionalRoot 'git-sources.additional.json') @{schemaVersion=1;repositories=@($conflicting)}
    Rejects { Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists } 'supplemental ID or URL collision fails before publication'
    Assert-That ((Read-ResearchText (Join-Path $additionalRoot 'git-sources.json')) -ceq $additionalOwned) 'conflicting supplemental import preserves exact owned inventory'
}
Write-ResearchJson (Join-Path $additionalRoot 'git-sources.additional.json') $additionalConfig
$additionalPortable=Join-Path $fixture 'additional-portable-checkout'
[void][IO.Directory]::CreateDirectory($additionalPortable)
Put (Join-Path $additionalPortable 'git-sources.json') $additionalOwned
Write-ResearchJson (Join-Path $additionalPortable 'git-sources.additional.json') $additionalConfig
$portableAdditional=Invoke-ResearchGitSync -ProjectRoot $additionalPortable -Action lists
Assert-That ($portableAdditional.repositories.Count -eq 2 -and $portableAdditional.sourceMode -eq 'owned_configuration') 'compiled and supplemental configurations remain portable without parent exports'

$caseUpper='https://example.test/Repo'
$caseLower='https://example.test/repo'
Put (Join-Path $additionalSource '.git-clone') ("clone 'ai-agents/case-source' '$caseLower'`n")
Put (Join-Path $additionalSource '.git-sources') ($caseUpper+"`n")
Rejects { Invoke-ResearchGitSync -ProjectRoot $additionalRoot -Action lists } 'non-GitHub path case cannot satisfy an auxiliary source declaration'
Assert-That ((Read-ResearchText (Join-Path $additionalRoot 'git-sources.json')) -ceq $additionalOwned) 'case-distinct source disagreement preserves owned inventory'

$caseRoot=Join-Path $fixture 'case-distinct-source-project'
[void][IO.Directory]::CreateDirectory((Join-Path $caseRoot '.cache/research'))
Put (Join-Path $caseRoot '.env') "TEAMAGENT_GIT_CACHE=cache`n"
Write-ResearchJson (Join-Path $caseRoot 'git-sources.json') @{schemaVersion=1;repositories=@(@{category='ai-agents';name='safe';url=$url},@{category='ai-agents';name='case-new';url=$caseLower})}
$casePrior=@{id='ai-agents--case-old';category='ai-agents';sourcePath='ai-agents/case-old';url=$caseUpper;path='cache/ai-agents/case-old';status='unchanged';head=(Git $work @('rev-parse','HEAD'));checkedAt=$now.ToString('o');upstreamHead=(Git $work @('rev-parse','HEAD'));availability='available';aliases=@();errors=@()}
$caseState=Join-Path $caseRoot '.cache/research/git-state.json'
$caseCredential=${function:Get-ResearchGitHubCredential}
function Get-ResearchGitHubCredential { return '' }
try {
    Write-ResearchJson $caseState @{schemaVersion=1;repositories=@($casePrior)}
    $caseResult=Invoke-ResearchGitSync -ProjectRoot $caseRoot -Action sync -Repository 'ai-agents--safe' -Concurrency 1 -TimeoutSeconds 15 -Now $now
    $caseNew=@($caseResult.repositories | Where-Object id -eq 'ai-agents--case-new')
    $caseOld=@($caseResult.repositories | Where-Object id -eq 'ai-agents--case-old')
    Assert-That ($caseResult.repositories.Count -eq 3 -and $caseOld.Count -eq 1 -and $caseOld[0].url -ceq $caseUpper -and -not $caseOld[0].listed -and $caseNew.Count -eq 1 -and $caseNew[0].url -ceq $caseLower -and $null -eq $caseNew[0].checkedAt -and $null -eq $caseNew[0].head -and $caseNew[0].availability -eq 'unknown') 'case-distinct source paths do not suppress retained rows or inherit prior identity evidence'
    $sameIdPrior=$casePrior.Clone();$sameIdPrior.id='ai-agents--case-new'
    Write-ResearchJson $caseState @{schemaVersion=1;repositories=@($sameIdPrior)}
    $sameIdResult=Invoke-ResearchGitSync -ProjectRoot $caseRoot -Action sync -Repository 'ai-agents--safe' -Concurrency 1 -TimeoutSeconds 15 -Now $now
    $sameIdNew=@($sameIdResult.repositories | Where-Object id -eq 'ai-agents--case-new')
    Assert-That ($sameIdNew.Count -eq 1 -and $sameIdNew[0].url -ceq $caseLower -and $null -eq $sameIdNew[0].checkedAt -and $null -eq $sameIdNew[0].head -and $sameIdNew[0].availability -eq 'unknown') 'same inventory ID does not transfer freshness across a case-distinct source URL'
} finally { Set-Item function:Get-ResearchGitHubCredential $caseCredential }

$identityRoot=Join-Path $fixture 'identity-project'
$identitySource=Join-Path $fixture 'identity-source'
foreach ($directory in @($identityRoot,$identitySource)) { [void][IO.Directory]::CreateDirectory($directory) }
Put (Join-Path $identityRoot '.env') "TEAMAGENT_GIT_CACHE=cache`nTEAMAGENT_GIT_SOURCES_DIR=../identity-source`n"
Put (Join-Path $identitySource '.git-clone') "clone 'ai-agents-manage/xx-2401-crewai' '$url'`n"
Put (Join-Path $identitySource '.git-sources') ($url+"`n")
$identityImport=Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action lists
Assert-That ($identityImport.repositories.Count -eq 1 -and $identityImport.repositories[0].id -ceq 'ai-agents-swarm--crewai' -and $identityImport.warnings -contains 'source_category_alias_ai-agents-manage_to_ai-agents-swarm') 'manage export category maps to existing swarm category without a twentieth category'
$identitySettings=Get-ResearchSettings $identityRoot
$identityPath=Get-ResearchSafePath $identitySettings.GitCache 'ai-agents-manage/crewai'
[void](Git $fixture @('clone','--',$url,$identityPath))
$identityPrior=@{id='ai-agents--crewai';category='ai-agents';sourcePath='ai-agents/crewai';url=$url;path='cache/ai-agents/crewai';aliases=@();status='unchanged';head=(Git $identityPath @('rev-parse','HEAD'));checkedAt=$now.ToString('o');availability='available';upstreamHead=(Git $identityPath @('rev-parse','HEAD'));errors=@()}
$identityState=Join-Path $identityRoot '.cache/research/git-state.json'
Write-ResearchJson $identityState @{schemaVersion=1;repositories=@($identityPrior)}
Put (Join-Path $identityPath 'retained-local.txt') "unchanged local text`n"
$identityObserved=Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action observe -Now $now.AddHours(1)
$identityRow=$identityObserved.repositories[0]
Assert-That ($identityObserved.repositories.Count -eq 1 -and $identityRow.id -ceq $identityPrior.id -and $identityRow.inventoryId -ceq 'ai-agents-swarm--crewai' -and $identityRow.path -ceq 'cache/ai-agents-manage/crewai' -and $identityRow.previousPath -ceq $identityPrior.path -and $identityRow.aliases -contains $identityPrior.path -and $identityRow.head -ceq $identityPrior.head -and $identityRow.dirty -and $identityRow.checkedAt -eq [DateTime]$identityPrior.checkedAt -and (Read-ResearchText (Join-Path $identityPath 'retained-local.txt')) -ceq "unchanged local text`n") 'observation reconciles moved same-origin checkout from owned inventory while preserving ID history local text and remote time'
$oldManagedCredential=${function:Get-ResearchGitHubCredential}
function Get-ResearchGitHubCredential { return '' }
try {
    $managedSync=Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action sync -Concurrency 1 -TimeoutSeconds 15 -Now $now
    Assert-That ($managedSync.repositories.Count -eq 1 -and $managedSync.repositories[0].id -ceq 'ai-agents-swarm--crewai' -and $managedSync.repositories[0].path -ceq 'cache/ai-agents-manage/crewai' -and (Read-ResearchText (Join-Path $identityPath 'retained-local.txt')) -ceq "unchanged local text`n") 'full sync reconciles unique unchanged-origin category move into one job and preserves local text'
} finally { Set-Item function:Get-ResearchGitHubCredential $oldManagedCredential }
$identityCollision=Get-ResearchSafePath $identitySettings.GitCache 'ai-agents-swarm/crewai'
[void][IO.Directory]::CreateDirectory($identityCollision)
$identityBlocked=Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action observe
Assert-That ($identityBlocked.repositories[0].status -eq 'inspection_failed' -and $null -eq $identityBlocked.repositories[0].head) 'observation rejects simultaneous canonical and alias checkout candidates'
[IO.Directory]::Delete($identityCollision)
[void](Git $identityPath @('remote','set-url','origin','https://example.invalid/not-the-source'))
$identityBlocked=Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action observe
Assert-That ($identityBlocked.repositories[0].status -eq 'inspection_failed' -and $null -eq $identityBlocked.repositories[0].head) 'observation of a moved folder still rejects wrong origin'
[void](Git $identityPath @('remote','set-url','origin',$url))
$identityConfig=Read-ResearchText (Join-Path $identityRoot 'git-sources.json')
foreach ($declaration in @("clone 'AI-AGENTS-MANAGE/sample' '$url'", "clone 'ai-agents-manage/../escape' '$url'", "clone 'ai-agents-manage/sample' '$url'`nclone 'ai-agents-swarm/sample' '$url'")) {
    Put (Join-Path $identitySource '.git-clone') ($declaration+"`n")
    Rejects { Invoke-ResearchGitSync -ProjectRoot $identityRoot -Action lists } 'manage category alias rejects casing traversal and duplicate canonical IDs'
    Assert-That ((Read-ResearchText (Join-Path $identityRoot 'git-sources.json')) -ceq $identityConfig) 'rejected manage import retains owned inventory'
}

$renameRoot=Join-Path $fixture 'reviewed-identity-project'
[void][IO.Directory]::CreateDirectory((Join-Path $renameRoot 'spec/analyses'))
Put (Join-Path $renameRoot '.env') "TEAMAGENT_GIT_CACHE=cache`n"
$renameRemote=Join-Path $fixture 'renamed-identity.git'
[void](Git $fixture @('clone','--bare','--',$work,$renameRemote))
$renameUrl=([Uri]$renameRemote).AbsoluteUri
Write-ResearchJson (Join-Path $renameRoot 'git-sources.json') @{schemaVersion=1;repositories=@(@{category='ai-skills';name='new-name';url=$renameUrl})}
$renameSettings=Get-ResearchSettings $renameRoot
$renameEntries=Read-ResearchSourceConfiguration $renameSettings
$renamePath=Get-ResearchSafePath $renameSettings.GitCache 'ai-skills/new-name'
[void](Git $fixture @('clone','--',$renameUrl,$renamePath))
$renameHead=Git $renamePath @('rev-parse','HEAD')
$renameBase=Git $renamePath @('rev-list','--max-parents=0','HEAD')
$renameOld=@{id='ai-skills--old-name';category='ai-skills';sourcePath='ai-skills/old-name';url=$url;path='cache/ai-skills/old-name';head=$renameBase;checkedAt=$now.ToString('o');upstreamHead=$renameBase;availability='available';backup=@{status='complete';privateFixture='retained only in machine state'};aliases=@();errors=@()}
$renameState=Join-Path $renameRoot '.cache/research/git-state.json'
[void][IO.Directory]::CreateDirectory((Join-Path $renameRoot '.cache/research'))
Write-ResearchJson $renameState @{schemaVersion=1;repositories=@($renameOld)}
$renameObserved=Invoke-ResearchGitSync -ProjectRoot $renameRoot -Action observe
$newCandidate=@($renameObserved.repositories | Where-Object id -eq 'ai-skills--new-name')
Assert-That ($renameObserved.repositories.Count -eq 2 -and $renameObserved.repositories[0].status -eq 'local_missing' -and $newCandidate.Count -eq 1 -and $newCandidate[0].head -ceq $renameHead -and $null -eq $newCandidate[0].checkedAt -and $null -eq $newCandidate[0].upstreamHead -and $newCandidate[0].availability -eq 'unknown') 'new configured local identity stays separate from missing prior identity and gains no upstream freshness'
$renameRecord=@{id=$renameOld.id;url=$renameUrl;aliases=@($url,'ai-skills--new-name');analyzedSha=$renameBase}
$renameEvent=@{id=$renameOld.id;action='renamed';at=$now.ToString('o');sha=$renameBase;previousSha=$renameBase}
$renameLedger=Join-Path $renameRoot 'spec/analyses/state.json'
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($renameRecord);events=@()}
$noEvent=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($noEvent.Count -eq 1 -and $noEvent[0].id -ceq $renameOld.id -and $noEvent[0].identityReconciliation.reason -eq 'reviewed_identity_event_missing') 'shared history and forged alias without explicit review event do not merge identities'
$oldIdentityGit=${function:Invoke-ResearchGit}
function Invoke-ResearchGit { throw 'unverified_identity_must_not_run_git' }
try {
    $blockedIdentity=Invoke-ResearchRepository @{id=$renameOld.id;category=$renameOld.category;name='old-name';sourcePath=$renameOld.sourcePath;url=$url} $noEvent[0] $renameSettings $now '' '' 15
    Assert-That ($blockedIdentity.status -eq 'blocked' -and -not $blockedIdentity.checkedThisRun -and $blockedIdentity.checkedAt -eq $renameOld.checkedAt) 'unverified reviewed mapping blocks Git effects and preserves previous remote observation'
} finally { Set-Item function:Invoke-ResearchGit $oldIdentityGit }
$wrongRecord=$renameRecord.Clone();$wrongRecord.aliases=@('https://example.invalid/unrelated','ai-skills--new-name')
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($wrongRecord);events=@($renameEvent)}
$wrongMapping=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($wrongMapping.Count -eq 1 -and $wrongMapping[0].url -ceq $url) 'review event for a different old URL does not establish this mapping'
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($renameRecord);events=@($renameEvent)}
[void](Git $renamePath @('remote','set-url','origin',$url))
$wrongOrigin=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($wrongOrigin[0].identityReconciliation.reason -eq 'repository_origin_mismatch') 'reviewed rename never bypasses actual origin check'
[void](Git $renamePath @('remote','set-url','origin',$renameUrl))
[void](Git $renamePath @('remote','set-url','origin',$caseUpper))
Rejects { Read-ResearchCheckout $renamePath $caseLower 15 -ReadOnly } 'checkout origin comparison preserves case-sensitive non-GitHub paths'
[void](Git $renamePath @('remote','set-url','origin',$renameUrl))
$missingBase=$renameRecord.Clone();$missingBase.analyzedSha=('f'*40)
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($missingBase);events=@($renameEvent)}
$wrongAncestry=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($wrongAncestry[0].identityReconciliation.reason -eq 'reviewed_identity_ancestry_unverified') 'missing full analyzed commit cannot reconcile a renamed identity'
$renameTree=Git $renamePath @('rev-parse','HEAD^{tree}')
$unrelatedCommit=Git $renamePath @('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit-tree',$renameTree,'-m','Unrelated fixture root')
$unrelatedRecord=$renameRecord.Clone();$unrelatedRecord.analyzedSha=$unrelatedCommit
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($unrelatedRecord);events=@($renameEvent)}
$unrelatedResult=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($unrelatedResult[0].identityReconciliation.reason -eq 'reviewed_identity_ancestry_unverified') 'an existing unrelated commit with identical tree cannot authorize a changed-origin identity'
$replacementCommit=Git $renamePath @('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit-tree',$renameTree,'-p',$unrelatedCommit,'-m','Replacement fixture graph')
[void](Git $renamePath @('replace',$renameHead,$replacementCommit))
$replacedAncestry=Invoke-ResearchGit $renamePath @('merge-base','--is-ancestor',$unrelatedCommit,$renameHead) '' 15
Assert-That ($replacedAncestry.exitCode -eq 0) 'replacement fixture reproduces false ancestry under ordinary Git graph traversal'
$immutableResult=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($immutableResult[0].identityReconciliation.reason -eq 'reviewed_identity_ancestry_unverified' -and (Git $renamePath @('rev-parse','HEAD')) -ceq $renameHead -and (Git $renamePath @('replace','-l')) -ceq $renameHead) 'reviewed identity ignores replacement graph without altering HEAD or replacement evidence'
[void](Git $renamePath @('replace','-d',$renameHead))
$graftPath=Join-Path $renamePath '.git/info/grafts'
Write-ResearchTextFile $graftPath ($renameHead+' '+$unrelatedCommit+"`n")
$graftedAncestry=Invoke-ResearchGit $renamePath @('merge-base','--is-ancestor',$unrelatedCommit,$renameHead) '' 15
Assert-That ($graftedAncestry.exitCode -eq 0) 'legacy graft fixture reproduces false ancestry under ordinary Git graph traversal'
$graftResult=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($graftResult[0].identityReconciliation.reason -eq 'reviewed_identity_ancestry_unverified' -and (Read-ResearchText $graftPath) -ceq ($renameHead+' '+$unrelatedCommit+"`n")) 'reviewed identity ignores legacy grafts without changing their retained bytes'
[IO.File]::Delete($graftPath)

$offlineTrace=Join-Path $fixture 'offline-identity-trace.jsonl'
$savedTrace=[Environment]::GetEnvironmentVariable('GIT_TRACE2_EVENT','Process')
[void](Git $renamePath @('config','remote.origin.promisor','true'))
[void](Git $renamePath @('config','remote.origin.partialclonefilter','blob:none'))
[void](Git $renamePath @('config','protocol.file.allow','always'))
[void](Git $renamePath @('config','protocol.ta-fixture.allow','always'))
try {
    [Environment]::SetEnvironmentVariable('GIT_TRACE2_EVENT',$offlineTrace,'Process')
    $missingObject=Invoke-ResearchGit $renamePath @('merge-base','--is-ancestor',('f'*40),$renameHead) '' 15 -ReadOnly
    $blockedFile=Invoke-ResearchGit $renamePath @('ls-remote','--',$renameUrl,'HEAD') '' 15 -ReadOnly
    $blockedHelper=Invoke-ResearchGit $renamePath @('ls-remote','--','ta-fixture::unavailable','HEAD') '' 15 -ReadOnly
} finally {
    [Environment]::SetEnvironmentVariable('GIT_TRACE2_EVENT',$savedTrace,'Process')
    [void](Git $renamePath @('config','--unset','remote.origin.promisor'))
    [void](Git $renamePath @('config','--unset','remote.origin.partialclonefilter'))
    [void](Git $renamePath @('config','--unset','protocol.file.allow'))
    [void](Git $renamePath @('config','--unset','protocol.ta-fixture.allow'))
}
$offlineEvents=@((Read-ResearchText $offlineTrace) -split '\r?\n' | Where-Object { $_ -ne '' } | ForEach-Object { ConvertFrom-Json $_ -AsHashtable })
Assert-That ($missingObject.exitCode -gt 0 -and $missingObject.error -eq '' -and $blockedFile.exitCode -gt 0 -and $blockedFile.stderr.Contains("transport 'file' not allowed") -and $blockedHelper.exitCode -gt 0 -and $blockedHelper.stderr.Contains("transport 'ta-fixture' not allowed") -and @($offlineEvents | Where-Object { $_.event -eq 'child_start' }).Count -eq 0) 'read-only missing promisor objects fail locally and all transports deny before any fetch or remote helper starts'
$ambiguousRecord=$renameRecord.Clone();$ambiguousRecord.aliases=@($url,'ai-skills--new-name','ai-skills--other-target')
$otherTarget=@{id='ai-skills--other-target';category='ai-skills';name='other-target';sourcePath='ai-skills/other-target';url=$renameUrl}
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($ambiguousRecord);events=@($renameEvent)}
$ambiguousResult=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) (@($renameEntries)+@($otherTarget)) $renameSettings 15
Assert-That ($ambiguousResult.Count -eq 1 -and $ambiguousResult[0].id -ceq $renameOld.id -and $ambiguousResult[0].identityReconciliation.status -eq 'unverified') 'multiple configured identity targets are rejected before merging'
Write-ResearchJson $renameLedger @{schemaVersion=1;records=@($renameRecord);events=@($renameEvent)}
$renameResolved=Resolve-ResearchReviewedIdentities @($renameOld.Clone()) @($renameEntries) $renameSettings 15
Assert-That ($renameResolved.Count -eq 1 -and $renameResolved[0].id -ceq 'ai-skills--new-name' -and $renameResolved[0].url -ceq $renameUrl -and $renameResolved[0].previousIdentities.Count -eq 1 -and $renameResolved[0].previousIdentities[0].checkedAt -eq $renameOld.checkedAt -and $renameResolved[0].previousIdentities[0].backup.privateFixture -eq 'retained only in machine state' -and $null -eq $renameResolved[0].checkedAt -and $null -eq $renameResolved[0].upstreamHead -and $renameResolved[0].availability -eq 'unknown' -and $renameResolved[0].identityReconciliation.ancestryVerified) 'reviewed exact mapping with full ancestry retains old private machine evidence without transferring remote freshness'
$recursiveOld=$renameOld.Clone();$recursiveOld.previousIdentities=@(@{id='recursive';url=$url;path='cache/recursive';previousIdentities=@()})
Rejects { Get-ResearchIdentityHistory $recursiveOld (New-ResearchObservedIdentity $renameEntries[0] $renameSettings) $renameSettings } 'recursive retained identity history is rejected'
$oversizedOld=$renameOld.Clone();$oversizedOld.extra=('x'*1048576)
Rejects { Get-ResearchIdentityHistory $oversizedOld (New-ResearchObservedIdentity $renameEntries[0] $renameSettings) $renameSettings } 'retained identity history has an aggregate byte bound'
$manyOld=$renameOld.Clone();$manyOld.previousIdentities=@(1..16 | ForEach-Object { @{id=('old-'+$_);url=$url;path=('cache/old-'+$_)} })
Rejects { Get-ResearchIdentityHistory $manyOld (New-ResearchObservedIdentity $renameEntries[0] $renameSettings) $renameSettings } 'retained identity history has an aggregate count bound'
$oldRenameCredential=${function:Get-ResearchGitHubCredential}
function Get-ResearchGitHubCredential { return '' }
try {
    Write-ResearchJson $renameState @{schemaVersion=1;repositories=@($renameOld)}
    $renameSynced=Invoke-ResearchGitSync -ProjectRoot $renameRoot -Action sync -Concurrency 1 -TimeoutSeconds 15 -Now $now
    Assert-That ($renameSynced.repositories.Count -eq 1 -and $renameSynced.repositories[0].id -ceq 'ai-skills--new-name' -and $renameSynced.repositories[0].previousIdentities.Count -eq 1 -and -not (Test-Path -LiteralPath (Join-Path $renameSettings.GitCache 'ai-skills/old-name'))) 'full sync retains reviewed identity history and does not reclone the old redirected source'
} finally { Set-Item function:Get-ResearchGitHubCredential $oldRenameCredential }
