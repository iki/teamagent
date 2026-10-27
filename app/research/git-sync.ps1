[CmdletBinding()]
param(
    [ValidateSet('lists','sync','status')][string]$Action='sync',
    [string]$ProjectRoot=([IO.Path]::GetFullPath('../..',$PSScriptRoot)),
    [ValidateRange(0,10000)][int]$Limit=0,
    [string]$Category='',
    [string]$Repository='',
    [switch]$NoAutoStash,
    [switch]$UsePrimaryBranch,
    [ValidateRange(5,600)][int]$TimeoutSeconds=120,
    [ValidateRange(1,8)][int]$Concurrency=4
)
. (Join-Path $PSScriptRoot 'git-common.ps1')
. (Join-Path $PSScriptRoot 'git-recovery.ps1')

function Get-ResearchPriorState {
    param([string]$Path,[hashtable]$Settings)
    if (-not (Test-Path -LiteralPath $Path)) { return ,@() }
    $state=ConvertFrom-Json -InputObject (Read-ResearchText $Path) -AsHashtable -Depth 20
    if ($state -isnot [Collections.IDictionary] -or $state.schemaVersion -ne 1 -or $state.repositories -isnot [array] -or $state.repositories.Count -gt 10000) { throw 'git_state_invalid' }
    $ids=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($row in $state.repositories) {
        if ($row -isnot [Collections.IDictionary] -or $row.id -isnot [string] -or $row.category -notin $script:ResearchCategories -or $row.url -isnot [string] -or $row.path -isnot [string] -or -not $ids.Add($row.id)) { throw 'git_state_invalid' }
        [void](Get-ResearchCanonicalUrl $row.url)
        $path=[IO.Path]::GetFullPath($row.path,$Settings.ProjectRoot)
        [void](Get-ResearchSafePath $Settings.GitCache ([IO.Path]::GetRelativePath($Settings.GitCache,$path)))
    }
    return ,$state.repositories
}
function Move-ResearchListFileOnce {
    param([string]$Source,[string]$Destination)
    [IO.File]::Move($Source,$Destination,$true)
}
function Move-ResearchListFile {
    param([string]$Source,[string]$Destination)
    $delays=@(100,250,500)
    for ($attempt=1;$attempt -le 4;$attempt++) {
        try { Move-ResearchListFileOnce $Source $Destination;return }
        catch {
            $cause=$_.Exception
            for ($depth=0;$depth -lt 8 -and $null -ne $cause.InnerException;$depth++) { $cause=$cause.InnerException }
            $nativeCode=$cause.HResult -band 65535
            $retryable=($cause -is [IO.IOException] -or $cause -is [UnauthorizedAccessException]) -and $nativeCode -in @(5,32,33)
            if (-not $retryable -or $attempt -eq 4) {
                [Console]::Error.WriteLine(('source_list_publication_failed: name={0}; attempts={1}; exceptionType={2}; hresult=0x{3:X8}; nativeCode={4}' -f [IO.Path]::GetFileName($Destination),$attempt,$cause.GetType().FullName,$cause.HResult,$nativeCode))
                throw
            }
            Start-Sleep -Milliseconds $delays[$attempt-1]
        }
    }
}
function Move-ResearchDirectory {
    param([string]$Source,[string]$Destination)
    # Same-parent native rename: never recursively copy, merge, or overwrite a tree.
    [IO.Directory]::Move($Source,$Destination)
}
function Move-ResearchRepositoryDirectory {
    param([string]$Root,[string]$Source,[string]$Destination)
    $failures=[Collections.Generic.List[object]]::new()
    $delays=@(100,250,500)
    for ($attempt=1;$attempt -le 4;$attempt++) {
        $sourcePath=Get-ResearchSafePath $Root ([IO.Path]::GetRelativePath($Root,$Source))
        $destinationPath=Get-ResearchSafePath $Root ([IO.Path]::GetRelativePath($Root,$Destination))
        if ([IO.Path]::GetDirectoryName($sourcePath) -ne [IO.Path]::GetDirectoryName($destinationPath)) { throw 'directory_rename_parent_mismatch' }
        if (Test-Path -LiteralPath $destinationPath) { return @{success=$false;error='directory_rename_destination_exists';attempts=($attempt-1);failures=$failures.ToArray()} }
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) { return @{success=$false;error='directory_rename_source_missing';attempts=($attempt-1);failures=$failures.ToArray()} }
        try {
            Move-ResearchDirectory $sourcePath $destinationPath
            return @{success=$true;attempts=$attempt;failures=$failures.ToArray()}
        } catch {
            $cause=$_.Exception
            for ($depth=0;$depth -lt 8 -and $null -ne $cause.InnerException;$depth++) { $cause=$cause.InnerException }
            $nativeCode=$cause.HResult -band 65535
            [void]$failures.Add(@{attempt=$attempt;exceptionType=$cause.GetType().FullName;hresult=('0x{0:X8}' -f $cause.HResult);nativeCode=$nativeCode})
            $retryable=($cause -is [IO.IOException] -or $cause -is [UnauthorizedAccessException]) -and $nativeCode -in @(5,32,33)
            if (-not $retryable -or $attempt -eq 4) {
                return @{success=$false;error=if ($retryable) {'directory_rename_sharing_or_access_exhausted'} else {'directory_rename_failed'};attempts=$attempt;failures=$failures.ToArray()}
            }
            Start-Sleep -Milliseconds $delays[$attempt-1]
        }
    }
}
function Write-ResearchLists {
    param([hashtable]$Settings,[array]$Entries)
    if (-not $Settings.ContainsKey('SourceHeader')) { throw 'source_loader_unverified' }
    # Imported headers are inert data; only the repository-owned loader is published.
    $lines=@($Entries | ForEach-Object { "clone '$($_.category)/$($_.name)' '$($_.url)'" })
    $urls=@($Entries | ForEach-Object { $_.url } | Select-Object -Unique)
    $configuration=[ordered]@{schemaVersion=1;repositories=@($Entries | Sort-Object category,name | ForEach-Object { [ordered]@{category=$_.category;name=$_.name;url=$_.url} })}
    $publications=@(
        @{name='.git-clone';text=$Settings.SourceHeader+"`n"+($lines -join "`n")+"`n"},
        @{name='.git-sources';text=($urls -join "`n")+"`n"},
        @{name='git-sources.json';text=($configuration | ConvertTo-Json -Depth 6)+"`n"}
    )
    $transaction=[Collections.Generic.List[object]]::new()
    try {
        foreach ($item in $publications) {
            $path=Get-ResearchSafePath $Settings.ProjectRoot $item.name
            $temporary=$path+'.tmp-'+[Guid]::NewGuid().ToString('N')
            $prior=if (Test-Path -LiteralPath $path) { Read-ResearchText $path } else { $null }
            $record=@{path=$path;temporary=$temporary;prior=$prior;changed=$false}
            [void]$transaction.Add($record)
            [IO.File]::WriteAllText($temporary,$item.text,[Text.UTF8Encoding]::new($false))
        }
        foreach ($record in $transaction) {
            [void](Get-ResearchSafePath $Settings.ProjectRoot ([IO.Path]::GetRelativePath($Settings.ProjectRoot,$record.path)))
            Move-ResearchListFile $record.temporary $record.path
            $record.changed=$true
        }
    } catch {
        $rollbackFailed=$false
        foreach ($record in $transaction) {
            if (-not $record.changed) { continue }
            try {
                [void](Get-ResearchSafePath $Settings.ProjectRoot ([IO.Path]::GetRelativePath($Settings.ProjectRoot,$record.path)))
                if ($null -eq $record.prior) { [IO.File]::Delete($record.path) }
                else {
                    [IO.File]::WriteAllText($record.temporary,$record.prior,[Text.UTF8Encoding]::new($false))
                    [IO.File]::Move($record.temporary,$record.path,$true)
                }
            } catch { $rollbackFailed=$true }
        }
        if ($rollbackFailed) { throw 'source_lists_rollback_failed' }
        throw 'source_lists_copy_failed_rolled_back'
    } finally {
        foreach ($record in $transaction) { if (Test-Path -LiteralPath $record.temporary) { [IO.File]::Delete($record.temporary) } }
    }
}
function Write-ResearchSourceConfiguration {
    param([hashtable]$Settings,[array]$Entries)
    $configuration=[ordered]@{schemaVersion=1;repositories=@($Entries | Sort-Object category,name | ForEach-Object { [ordered]@{category=$_.category;name=$_.name;url=$_.url} })}
    $path=Get-ResearchSafePath $Settings.ProjectRoot 'git-sources.json'
    $temporary=$path+'.tmp-'+[Guid]::NewGuid().ToString('N')
    try {
        [IO.File]::WriteAllText($temporary,($configuration | ConvertTo-Json -Depth 6)+"`n",[Text.UTF8Encoding]::new($false))
        [void](Get-ResearchSafePath $Settings.ProjectRoot 'git-sources.json')
        Move-ResearchListFile $temporary $path
    } finally {
        if (Test-Path -LiteralPath $temporary) { [IO.File]::Delete($temporary) }
    }
}

function Find-ResearchRepository {
    param([hashtable]$Entry,[object]$Previous,[hashtable]$Settings)
    $candidates=[Collections.Generic.List[string]]::new()
    if ($null -ne $Previous -and $Previous.path -is [string]) {
        $old=[IO.Path]::GetFullPath($Previous.path,$Settings.ProjectRoot)
        [void]$candidates.Add((Get-ResearchSafePath $Settings.GitCache ([IO.Path]::GetRelativePath($Settings.GitCache,$old))))
    }
    foreach ($relative in @($Entry.sourcePath,($Entry.category+'/'+$Entry.name))) { [void]$candidates.Add((Get-ResearchSafePath $Settings.GitCache $relative)) }
    $categoryPath=Get-ResearchSafePath $Settings.GitCache $Entry.category
    if (Test-Path -LiteralPath $categoryPath) {
        foreach ($child in Get-ChildItem -LiteralPath $categoryPath -Directory -Force) {
            if ($child.Name -match '^\.clone-') { continue }
            if ((Get-ResearchBaseName $child.Name $Settings) -eq $Entry.name) { [void]$candidates.Add((Get-ResearchSafePath $Settings.GitCache ($Entry.category+'/'+$child.Name))) }
        }
    }
    $existing=@($candidates | Select-Object -Unique | Where-Object { Test-Path -LiteralPath $_ })
    if ($existing.Count -gt 1) { throw 'repository_alias_collision' }
    if ($existing.Count -eq 1) { return $existing[0] }
    return Get-ResearchSafePath $Settings.GitCache ($Entry.category+'/'+$Entry.name)
}
function Read-ResearchCheckout {
    param([string]$Path,[string]$ExpectedUrl,[int]$TimeoutSeconds)
    if (-not (Test-Path -LiteralPath (Join-Path $Path '.git') -PathType Container)) { throw 'repository_not_standalone_checkout' }
    if ((Get-Item -LiteralPath (Join-Path $Path '.git') -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'reparse_path_rejected' }
    $origin=Invoke-ResearchGit $Path @('remote','get-url','origin') '' $TimeoutSeconds
    if ($origin.exitCode -ne 0 -or (Get-ResearchCanonicalUrl $origin.stdout.Trim()) -ne $ExpectedUrl) { throw 'repository_origin_mismatch' }
    $status=Invoke-ResearchGit $Path @('status','--porcelain=v1','--untracked-files=normal','--ignore-submodules=none') '' $TimeoutSeconds
    $head=Invoke-ResearchGit $Path @('rev-parse','--verify','HEAD') '' $TimeoutSeconds
    $shallow=Invoke-ResearchGit $Path @('rev-parse','--is-shallow-repository') '' $TimeoutSeconds
    if ($status.exitCode -ne 0 -or $shallow.exitCode -ne 0) { throw 'repository_inspection_failed' }
    $sha=if ($head.exitCode -eq 0 -and $head.stdout.Trim() -match '^(?:[a-f0-9]{40}|[a-f0-9]{64})$') { $head.stdout.Trim() } else { $null }
    return @{dirty=($status.stdout.Length -gt 0);head=$sha;shallow=($shallow.stdout.Trim() -eq 'true')}
}
function Get-ResearchAvailability {
    param([hashtable]$Entry,[hashtable]$Settings,[string]$Token,[bool]$Authenticated,[int]$TimeoutSeconds)
    $githubPath=if ($Entry.url -match '^https://github\.com/([a-z0-9_.-]+/[a-z0-9_.-]+)$') { '/repos/'+$Matches[1] } else { '' }
    $notFound=0
    for ($attempt=1;$attempt -le 3;$attempt++) {
        $remote=Invoke-ResearchGit $Settings.ProjectRoot @('ls-remote','--symref','--',$Entry.url,'HEAD') '' $TimeoutSeconds
        if ($remote.exitCode -eq 0) {
            $sha=$null; $branch=$null
            foreach ($line in $remote.stdout -split '\r?\n') {
                if ($line -match '^((?:[a-f0-9]{40}|[a-f0-9]{64}))\s+HEAD$') { $sha=$Matches[1] }
                if ($line -match '^ref:\s+(refs/heads/[^\s]+)\s+HEAD$') { $branch=$Matches[1] }
            }
            return @{status='available';attempts=$attempt;head=$sha;branch=$branch;reason='git_remote_reachable'}
        }
        if ($Authenticated -and $githubPath -ne '') {
            $api=Invoke-ResearchGitHub $githubPath $Token
            if ($api.status -eq 404) { $notFound++ }
            elseif ($api.status -in @(401,403,429) -or $api.status -eq 0 -or $api.status -ge 500) {
                return @{status='unknown';attempts=$attempt;head=$null;branch=$null;reason='authentication_rate_limit_or_transport'}
            }
        }
        if ($attempt -lt 3) { Start-Sleep -Milliseconds (250*$attempt) }
    }
    if ($notFound -eq 3) { return @{status='not_found_or_inaccessible';attempts=3;head=$null;branch=$null;reason='repeated_authenticated_404'} }
    return @{status='unknown';attempts=3;head=$null;branch=$null;reason='remote_unavailable_unconfirmed'}
}
function Get-ResearchMissingEvidence {
    param([object]$Previous,[string]$Availability,[DateTimeOffset]$Now)
    if ($Availability -ne 'not_found_or_inaccessible') { return @{firstMissingAt=$null;lastMissingAt=$null;observations=0;confirmed=$false} }
    $first=$Now; $count=1
    if ($null -ne $Previous -and $Previous.Contains('availabilityEvidence')) {
        $evidence=$Previous.availabilityEvidence
        $parsed=[DateTimeOffset]::MinValue
        $valid=$false
        if ($evidence -is [Collections.IDictionary]) {
            $value=$evidence.firstMissingAt
            # ConvertFrom-Json returns zoned ISO dates as DateTime on some supported PowerShell versions.
            # Preserve the instant rather than resetting evidence after the state file is read again.
            if ($value -is [DateTimeOffset]) { $parsed=$value;$valid=$true }
            elseif ($value -is [DateTime] -and $value.Kind -ne [DateTimeKind]::Unspecified) { $parsed=[DateTimeOffset]::new($value);$valid=$true }
            elseif ($value -is [string] -and $value -match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$') {
                $valid=[DateTimeOffset]::TryParse($value,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::None,[ref]$parsed)
            }
        }
        if ($valid -and $parsed -le $Now) {
            $first=$parsed
            if ($evidence.observations -is [long] -or $evidence.observations -is [int]) { $count=[Math]::Min(100000,[Math]::Max(1,$evidence.observations)+1) }
        }
    }
    return @{firstMissingAt=$first.ToString('o');lastMissingAt=$Now.ToString('o');observations=$count;confirmed=($count -ge 2 -and ($Now-$first).TotalHours -ge 24)}
}
function Push-ResearchBackupHistory {
    param([string]$RepositoryPath,[string]$Url,[int]$TimeoutSeconds)
    $limitations=[Collections.Generic.List[string]]::new()
    $shallow=Invoke-ResearchGit $RepositoryPath @('rev-parse','--is-shallow-repository') '' $TimeoutSeconds
    if ($shallow.exitCode -ne 0 -or $shallow.stdout.Trim() -ne 'false') { [void]$limitations.Add('shallow_or_unknown_history') }
    $files=Invoke-ResearchGit $RepositoryPath @('ls-files','--stage') '' $TimeoutSeconds
    if ($files.exitCode -ne 0 -or $files.stdout -match '(?m)^160000 ') { [void]$limitations.Add('submodule_objects_not_included_or_unknown') }
    $lfs=Invoke-ResearchGit $RepositoryPath @('grep','-I','-l','filter=lfs','--','.gitattributes',':(glob)**/.gitattributes') '' $TimeoutSeconds
    if ($lfs.exitCode -ne 1) { [void]$limitations.Add('lfs_objects_not_included_or_unknown') }
    $refs=Invoke-ResearchGit $RepositoryPath @('for-each-ref','--format=%(objectname) %(refname) %(symref)','refs/heads/','refs/remotes/origin/','refs/tags/') '' $TimeoutSeconds
    if ($refs.exitCode -ne 0) { return @{status='failed';reason='backup_refs_unreadable';verifiedRefs=0;limitations=$limitations.ToArray()} }
    $expected=[ordered]@{}; $refspecs=[Collections.Generic.List[string]]::new()
    foreach ($line in $refs.stdout -split '\r?\n') {
        if ($line -eq '') { continue }
        if ($line -notmatch '^((?:[a-f0-9]{40}|[a-f0-9]{64})) (refs/(?:heads|tags|remotes/origin)/[^\s]+) (.*)$') { return @{status='failed';reason='backup_refs_invalid';verifiedRefs=0;limitations=$limitations.ToArray()} }
        $sha=$Matches[1];$source=$Matches[2];$symbolic=$Matches[3]
        if ($symbolic -ne '') { continue }
        $destination=if ($source.StartsWith('refs/heads/')) { 'refs/heads/local/'+$source.Substring(11) } elseif ($source.StartsWith('refs/remotes/origin/')) { 'refs/heads/upstream/'+$source.Substring(20) } else { $source }
        $expected[$destination]=$sha;[void]$refspecs.Add($source+':'+$destination)
        if ($expected.Count -gt 10000) { return @{status='failed';reason='backup_ref_limit';verifiedRefs=0;limitations=$limitations.ToArray()} }
    }
    $head=Invoke-ResearchGit $RepositoryPath @('rev-parse','--verify','HEAD') '' $TimeoutSeconds
    if ($head.exitCode -eq 0 -and $head.stdout.Trim() -match '^(?:[a-f0-9]{40}|[a-f0-9]{64})$') {
        $sha=$head.stdout.Trim();$destination='refs/heads/snapshots/'+$sha
        $expected[$destination]=$sha;[void]$refspecs.Add($sha+':'+$destination)
    }
    if ($expected.Count -eq 0) { return @{status='failed';reason='backup_no_retained_refs';verifiedRefs=0;limitations=$limitations.ToArray()} }
    # Explicit non-forced namespaces preserve upstream-only refs and local branches independently.
    for ($offset=0;$offset -lt $refspecs.Count;$offset+=50) {
        $last=[Math]::Min($offset+49,$refspecs.Count-1)
        $push=Invoke-ResearchGit $RepositoryPath (@('push','--',$Url)+@($refspecs.ToArray()[$offset..$last])) '' $TimeoutSeconds
        if ($push.exitCode -ne 0) { return @{status='failed';reason='backup_push_failed';verifiedRefs=0;limitations=$limitations.ToArray()} }
    }
    $remote=Invoke-ResearchGit $RepositoryPath @('ls-remote','--refs','--',$Url) '' $TimeoutSeconds
    if ($remote.exitCode -ne 0) { return @{status='failed';reason='backup_verification_unavailable';verifiedRefs=0;limitations=$limitations.ToArray()} }
    $actual=@{}
    foreach ($line in $remote.stdout -split '\r?\n') { if ($line -match '^((?:[a-f0-9]{40}|[a-f0-9]{64}))\s+(refs/[^\s]+)$') { $actual[$Matches[2]]=$Matches[1] } }
    $verified=0
    foreach ($name in $expected.Keys) { if (-not $actual.ContainsKey($name) -or $actual[$name] -ne $expected[$name]) { return @{status='failed';reason='backup_ref_verification_failed';verifiedRefs=$verified;limitations=$limitations.ToArray()} };$verified++ }
    return @{status=if ($limitations.Count -eq 0) {'complete'} else {'partial'};reason=if ($limitations.Count -eq 0) {'git_refs_verified'} else {'git_refs_verified_with_object_limits'};verifiedRefs=$verified;limitations=$limitations.ToArray()}
}
function Test-ResearchBackupResponse {
    param([object]$Data,[string]$Owner)
    return ($Data -is [Collections.IDictionary] -and $Data.Contains('id') -and ($Data.id -is [long] -or $Data.id -is [int]) -and $Data.id -gt 0 -and $Data.Contains('private') -and $Data.private -eq $true -and $Data.Contains('owner') -and $Data.owner -is [Collections.IDictionary] -and $Data.owner.Contains('login') -and $Data.owner.login -is [string] -and $Data.owner.login -ieq $Owner)
}
function Invoke-ResearchBackup {
    param([hashtable]$Row,[string]$RepositoryPath,[hashtable]$Settings,[string]$Token,[string]$Login,[object]$Previous,[int]$TimeoutSeconds)
    if ($Token -eq '' -or $Login -eq '') { return @{status='unavailable';reason='github_credentials_unavailable';url=$null} }
    if ($Row.url -notmatch '^https://github\.com/([a-z0-9_.-]+)/([a-z0-9_.-]+)$') { return @{status='unsupported';reason='github_repository_required';url=$null} }
    $sourceOwner=$Matches[1]; $sourceName=$Matches[2]
    $hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Row.url))).Substring(0,10).ToLowerInvariant()
    $name=('research-'+$sourceOwner+'-'+$sourceName)
    if ($name.Length -gt 80) { $name=$name.Substring(0,80) }
    $name+='-'+$hash
    $owner=if ($Settings.Values.TEAMAGENT_GIT_BACKUP_ACCOUNT -eq '') { $Login } else { $Settings.Values.TEAMAGENT_GIT_BACKUP_ACCOUNT }
    $endpoint='/repos/'+$owner+'/'+$name; $url='https://github.com/'+$owner+'/'+$name
    $existing=Invoke-ResearchGitHub $endpoint $Token
    if ($existing.status -eq 200) {
        $owned=$false
        if (Test-ResearchBackupResponse $existing.data $owner) {
            if ($null -ne $Previous -and $Previous.Contains('backup') -and $Previous.backup -is [Collections.IDictionary]) {
                $known=$Previous.backup
                $owned=$known.Contains('createdBy') -and $known.Contains('sourceUrl') -and $known.Contains('url') -and $known.Contains('repositoryId') -and $known.createdBy -eq 'teamagent-research' -and $known.sourceUrl -eq $Row.url -and $known.url -eq $url -and $known.repositoryId -eq $existing.data.id
            }
        }
        if (-not $owned) { return @{status='blocked';reason='backup_destination_collision_or_unverified';url=$url} }
    } elseif ($existing.status -eq 404) {
        $createEndpoint=if ($owner -ieq $Login) { '/user/repos' } else { '/orgs/'+$owner+'/repos' }
        $existing=Invoke-ResearchGitHub $createEndpoint $Token 'POST' @{name=$name;private=$true;description=('Teamagent private source-history backup: '+$Row.url);auto_init=$false}
        if ($existing.status -ne 201) { return @{status='failed';reason='backup_creation_failed';url=$url} }
    } else { return @{status='unavailable';reason='backup_destination_unverified';url=$url} }
    if (-not (Test-ResearchBackupResponse $existing.data $owner)) { return @{status='failed';reason='backup_privacy_unverified';url=$url} }
    $result=Push-ResearchBackupHistory $RepositoryPath $url $TimeoutSeconds
    $result.url=$url;$result.repositoryId=$existing.data.id;$result.createdBy='teamagent-research';$result.sourceUrl=$Row.url
    $result.scope='retained_local_and_origin_branches_tags_head_git_objects';$result.excludes=@('uncommitted_and_ignored_files','unfetched_history','historical_lfs_and_submodule_payloads')
    return $result
}

function Invoke-ResearchRepository {
    param([hashtable]$Entry,[object]$Previous,[hashtable]$Settings,[DateTimeOffset]$Now,[string]$Token,[string]$Login,[int]$TimeoutSeconds)
    $row=@{id=$Entry.id;checkedThisRun=$true;checkedAt=$Now.ToString('o');listed=if ($Entry.ContainsKey('listed')) {$Entry.listed} else {$true};listStatus=if ($Entry.ContainsKey('listed') -and -not $Entry.listed) {'source_list_removed'} else {'listed'};category=$Entry.category;sourcePath=$Entry.sourcePath;url=$Entry.url;path=Get-ResearchRelativePath $Settings.ProjectRoot (Join-Path $Settings.GitCache ($Entry.category+'/'+$Entry.name));previousPath=$null;aliases=@();status='error';lifecycle='unknown';availability='unknown';availabilityEvidence=@{firstMissingAt=$null;lastMissingAt=$null;observations=0;confirmed=$false};dirty=$null;shallow=$null;head=$null;upstreamHead=$null;lastCommitAt=$null;backup=@{status='not_needed';reason='';url=$null};errors=@()}
    try {
        $path=Find-ResearchRepository $Entry $Previous $Settings
        $row.path=Get-ResearchRelativePath $Settings.ProjectRoot $path
        if ($null -ne $Previous -and $Previous.Contains('aliases') -and $Previous.aliases -is [array]) { $row.aliases=@($Previous.aliases | Where-Object { $_ -is [string] } | Select-Object -First 100) }
        $exists=Test-Path -LiteralPath $path
        if ($exists) {
            $checkout=Read-ResearchCheckout $path $Entry.url $TimeoutSeconds
            $row.dirty=$checkout.dirty; $row.shallow=$checkout.shallow; $row.head=$checkout.head
        }
        $available=Get-ResearchAvailability $Entry $Settings $Token ($Login -ne '') $TimeoutSeconds
        $row.availability=$available.status; $row.availabilityReason=$available.reason; $row.availabilityAttempts=$available.attempts; $row.upstreamHead=$available.head
        $row.availabilityEvidence=Get-ResearchMissingEvidence $Previous $available.status $Now
        if ($available.status -ne 'available') {
            $row.status=if ($row.dirty -eq $true) { 'dirty' } else { 'blocked' }
            $row.lifecycle='unavailable'; $row.errors=@($available.reason)
            if ($row.availabilityEvidence.confirmed) {
                $row.lifecycle='removed'
                $row.backup=if ($exists) { Invoke-ResearchBackup $row $path $Settings $Token $Login $Previous $TimeoutSeconds } else { @{status='unavailable';reason='local_repository_missing';url=$null} }
            }
        } elseif (-not $exists) {
            $parent=Get-ResearchSafePath $Settings.GitCache $Entry.category
            [void][IO.Directory]::CreateDirectory($parent)
            $stage=Get-ResearchSafePath $Settings.GitCache ($Entry.category+'/.clone-'+[Guid]::NewGuid().ToString('N'))
            $clone=Invoke-ResearchGit $Settings.ProjectRoot @('clone','--no-recurse-submodules','--',$Entry.url,$stage) '' $TimeoutSeconds
            if ($clone.exitCode -ne 0) { $row.errors=@('clone_failed');$row.partialPath=Get-ResearchRelativePath $Settings.ProjectRoot $stage;$row.status='error';$row.lifecycle='unavailable';return $row }
            # Revalidate the final target immediately before moving a completed clone.
            $path=Get-ResearchSafePath $Settings.GitCache ($Entry.category+'/'+$Entry.name)
            if (Test-Path -LiteralPath $path) { throw 'clone_destination_appeared' }
            $row.partialPath=Get-ResearchRelativePath $Settings.ProjectRoot $stage
            $publication=Move-ResearchRepositoryDirectory $Settings.GitCache $stage $path
            $row.directoryMove=@{stage='clone_publication';source=Get-ResearchRelativePath $Settings.ProjectRoot $stage;destination=Get-ResearchRelativePath $Settings.ProjectRoot $path;result=$publication}
            if (-not $publication.success) { $row.errors=@($publication.error);return $row }
            [void]$row.Remove('partialPath')
            $row.status='cloned'; $row.lifecycle='active'
        } else {
            $fetch=Invoke-ResearchGit $path @('fetch','--no-recurse-submodules','origin') '' $TimeoutSeconds
            if ($fetch.exitCode -ne 0) { $row.status='error';$row.errors=@('fetch_failed');$row.lifecycle='unavailable';return $row }
            $row.lifecycle='active'
            $updated=Update-ResearchCheckout $Entry $path $Settings $available $Now $TimeoutSeconds
            $row.status=$updated.status;$row.errors=$updated.errors;$row.recovery=$updated.recovery
            if ($null -eq $row.recovery -and $null -ne $Previous -and $Previous.Contains('recovery')) { $row.recovery=$Previous.recovery }
        }
        if (Test-Path -LiteralPath $path) {
            $observed=Read-ResearchCheckout $path $Entry.url $TimeoutSeconds
            # Update-ResearchCheckout distinguishes a no-op from a branch switch at the same commit.
            $row.head=$observed.head; $row.shallow=$observed.shallow; $row.dirty=$observed.dirty
            if ($row.head -ne $null) {
                $dateRef=if ($row.upstreamHead -ne $null) { $row.upstreamHead } else { $row.head }
                $date=Invoke-ResearchGit $path @('show','-s','--format=%cI',$dateRef) '' $TimeoutSeconds
                $parsed=[DateTimeOffset]::MinValue
                if ($date.exitCode -eq 0 -and [DateTimeOffset]::TryParse($date.stdout.Trim(),[ref]$parsed)) {
                    $row.lastCommitAt=$parsed.ToString('o')
                    if ($row.lifecycle -eq 'active' -and $parsed -lt (Get-ResearchCutoff $Now $Settings.Values.TEAMAGENT_GIT_OUTDATED_THRESHOLD)) { $row.lifecycle='outdated' }
                } else { $row.errors+=@('upstream_commit_time_unverified') }
            }
            if (-not $row.dirty -and $row.lifecycle -in @('active','outdated','removed')) {
                $prefix=''
                if ($row.lifecycle -eq 'outdated') { $prefix=$Settings.Values.TEAMAGENT_GIT_OUTDATED_PREFIX.Replace('<YYMM>',([DateTimeOffset]::Parse($row.lastCommitAt)).ToString('yyMM')) }
                if ($row.lifecycle -eq 'removed') { $prefix=$Settings.Values.TEAMAGENT_GIT_REMOVED_PREFIX.Replace('<YYMM>',$Now.ToString('yyMM')) }
                $target=Get-ResearchSafePath $Settings.GitCache ($Entry.category+'/'+$prefix+$Entry.name)
                if ($target -ne $path) {
                    if (Test-Path -LiteralPath $target) { $row.errors+=@('rename_destination_exists') }
                    else {
                        [void](Get-ResearchSafePath $Settings.GitCache ([IO.Path]::GetRelativePath($Settings.GitCache,$path)))
                        $beforeRename=Read-ResearchCheckout $path $Entry.url $TimeoutSeconds
                        if ($beforeRename.dirty) { $row.dirty=$true;$row.status='dirty';return $row }
                        $rename=Move-ResearchRepositoryDirectory $Settings.GitCache $path $target
                        $row.directoryMove=@{stage='lifecycle_rename';source=Get-ResearchRelativePath $Settings.ProjectRoot $path;destination=Get-ResearchRelativePath $Settings.ProjectRoot $target;result=$rename}
                        if (-not $rename.success) { $row.errors+=@($rename.error);$row.status='error';return $row }
                        $row.previousPath=$row.path; $row.aliases=@($row.aliases+$row.path | Select-Object -Unique)
                        $row.path=Get-ResearchRelativePath $Settings.ProjectRoot $target
                    }
                }
            }
        }
    } catch {
        $known=@('repository_alias_collision','repository_not_standalone_checkout','repository_origin_mismatch','repository_inspection_failed','reparse_path_rejected','reparse_cache_rejected','path_outside_cache','clone_destination_appeared','repository_name_invalid','directory_rename_parent_mismatch')
        $row.errors+=if ($_.Exception.Message -in $known) { $_.Exception.Message } else { 'repository_operation_failed' }
        $row.status='error'
    }
    return $row
}
function Read-ResearchCurrentStatus {
    param([string]$StatePath,[hashtable]$Settings,[int]$TimeoutSeconds,[DateTimeOffset]$Now)
    $rows=Get-ResearchPriorState $StatePath $Settings
    $partial=$false
    foreach ($row in $rows) {
        $row.inspectedAt=$Now.ToString('o')
        try {
            $path=[IO.Path]::GetFullPath($row.path,$Settings.ProjectRoot)
            if (-not (Test-Path -LiteralPath $path)) { $row.status='local_missing';$row.dirty=$null;$row.head=$null;$row.shallow=$null;$partial=$true;continue }
            $observed=Read-ResearchCheckout $path $row.url $TimeoutSeconds
            $row.dirty=$observed.dirty;$row.head=$observed.head;$row.shallow=$observed.shallow
            $row.status=if ($observed.dirty) {'dirty'} else {'inspected'}
            if ($observed.dirty) { $partial=$true }
        } catch { $row.status='inspection_failed';$row.errors=@('current_checkout_unverified');$partial=$true }
    }
    return @{schemaVersion=1;generatedAt=$Now.ToString('o');discoveryComplete=$false;sourceListComplete=$false;inspectionComplete=$true;status=if ($partial) {'partial'} else {'complete'};repositories=@($rows)}
}

function Invoke-ResearchGitSync {
    param([string]$ProjectRoot,[string]$Action='sync',[int]$Limit=0,[string]$Category='',[int]$TimeoutSeconds=120,[int]$Concurrency=4,[string]$Repository='',[switch]$NoAutoStash,[switch]$UsePrimaryBranch,[DateTimeOffset]$Now=[DateTimeOffset]::UtcNow)
    $settings=Get-ResearchSettings $ProjectRoot
    $settings.UsePrimaryBranch=[bool]$UsePrimaryBranch
    if ($NoAutoStash) { $settings.Values.TEAMAGENT_GIT_AUTO_STASH='false' }
    $directory=Get-ResearchSafePath $settings.ProjectRoot '.cache/research'
    [void][IO.Directory]::CreateDirectory($directory)
    $statePath=Get-ResearchSafePath $settings.ProjectRoot '.cache/research/git-state.json'
    if ($Action -eq 'status') {
        if (-not (Test-Path -LiteralPath $statePath)) { throw 'git_state_missing' }
        return Read-ResearchCurrentStatus $statePath $settings $TimeoutSeconds $Now
    }
    if ($Category -ne '' -and $Category -cnotin $script:ResearchCategories) { throw 'category_invalid' }
    $lockPath=Get-ResearchSafePath $settings.ProjectRoot '.cache/research/git-sync.lock'
    $lock=$null
    try {
        $lock=[IO.File]::Open($lockPath,[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::Write,[IO.FileShare]::None)
        $entries=Read-ResearchSourceList $settings -Import:($Action -eq 'lists')
        if ($Action -eq 'lists') {
            Write-ResearchSourceConfiguration $settings $entries
            $importResult=@{schemaVersion=1;generatedAt=$Now.ToString('o');sourceListComplete=$true;discoveryComplete=$false;status='complete';sourceMode=$settings.SourceMode;warnings=$settings.SourceWarnings;repositories=$entries;files=@('git-sources.json')}
            Write-ResearchJson (Join-Path $directory 'source-import.json') $importResult
            return $importResult
        }
        [void][IO.Directory]::CreateDirectory($settings.GitCache)
        $previous=Get-ResearchPriorState $statePath $settings
        foreach ($entry in $entries) { $entry.listed=$true }
        foreach ($oldEntry in $previous) {
            if (@($entries | Where-Object { $_.id -eq $oldEntry.id }).Count -eq 0) {
                $name=Get-ResearchBaseName ($oldEntry.id.Substring($oldEntry.category.Length+2)) $settings
                $entries+=@(@{id=$oldEntry.id;category=$oldEntry.category;name=$name;sourcePath=$oldEntry.category+'/'+$name;url=$oldEntry.url;listed=$false})
            }
        }
        if ($Repository -ne '' -and @($entries | Where-Object { $_.id -eq $Repository }).Count -ne 1) { throw 'repository_filter_invalid' }
        $token=Get-ResearchGitHubCredential $settings.ProjectRoot; $login=''
        if ($token -ne '') {
            $user=Invoke-ResearchGitHub '/user' $token
            if ($user.status -eq 200 -and $user.data -is [Collections.IDictionary] -and $user.data.Contains('login') -and $user.data.login -is [string] -and $user.data.login -match '^[A-Za-z0-9][A-Za-z0-9-]{0,38}$') { $login=$user.data.login }
        }
        $jobs=[Collections.Generic.List[object]]::new(); $results=[Collections.Generic.List[object]]::new(); $selected=0
        foreach ($entry in $entries) {
            $old=@($previous | Where-Object { $_.id -eq $entry.id -and $_.url -eq $entry.url })
            if ($old.Count -eq 0 -and @($entries | Where-Object { $_.url -eq $entry.url }).Count -eq 1) { $old=@($previous | Where-Object { $_.url -eq $entry.url }) }
            $prior=if ($old.Count -eq 1) { $old[0] } else { $null }
            if (($Repository -ne '' -and $entry.id -ne $Repository) -or ($Category -ne '' -and $entry.category -ne $Category) -or ($Limit -gt 0 -and $selected -ge $Limit)) {
                if ($null -ne $prior) { $prior.listed=$entry.listed;$prior.listStatus=if ($entry.listed) {'listed'} else {'source_list_removed'};$prior.checkedThisRun=$false;[void]$results.Add($prior) }
                else { [void]$results.Add(@{id=$entry.id;checkedThisRun=$false;checkedAt=$null;listed=$entry.listed;listStatus=if ($entry.listed) {'listed'} else {'source_list_removed'};category=$entry.category;sourcePath=$entry.sourcePath;url=$entry.url;path=Get-ResearchRelativePath $settings.ProjectRoot (Join-Path $settings.GitCache ($entry.category+'/'+$entry.name));status='not_processed';lifecycle='unknown';dirty=$null;shallow=$null;head=$null;upstreamHead=$null;lastCommitAt=$null;availability='unknown';backup=@{status='not_attempted';url=$null};errors=@()}) }
                continue
            }
            $selected++; [void]$jobs.Add(@{entry=$entry;previous=$prior})
        }
        $scriptFile=Join-Path $PSScriptRoot 'git-sync.ps1'
        $config=@{sourcesDirectory=if ($settings.SourcesDirectory -eq '') {$null} else {Get-ResearchRelativePath $settings.ProjectRoot $settings.SourcesDirectory};sourceMode=$settings.SourceMode;sourceConfiguration='git-sources.json';gitCache=Get-ResearchRelativePath $settings.ProjectRoot $settings.GitCache;outdatedThreshold=$settings.Values.TEAMAGENT_GIT_OUTDATED_THRESHOLD;outdatedPrefix=$settings.Values.TEAMAGENT_GIT_OUTDATED_PREFIX;removedPrefix=$settings.Values.TEAMAGENT_GIT_REMOVED_PREFIX;autoStash=($settings.Values.TEAMAGENT_GIT_AUTO_STASH -eq 'true');usePrimaryBranch=[bool]$UsePrimaryBranch}
        $jobs.ToArray() | ForEach-Object -Parallel {
            . $using:scriptFile
            Invoke-ResearchRepository $_.entry $_.previous $using:settings $using:Now $using:token $using:login $using:TimeoutSeconds
        } -ThrottleLimit $Concurrency | ForEach-Object {
            [void]$results.Add($_)
            [Console]::Error.WriteLine(('Repository {0}/{1}: {2} ({3})' -f ($results.Count),$entries.Count,$_.id,$_.status))
            Write-ResearchJson (Join-Path $directory 'git-sync.json') @{schemaVersion=1;generatedAt=$Now.ToString('o');discoveryComplete=$false;status='running';config=$config;repositories=$results.ToArray()}
        }
        $token=''
        $rows=@($results.ToArray() | Sort-Object id)
        $partial=@($rows | Where-Object { $_.status -in @('error','diverged','blocked','not_processed','dirty','ahead','stash_conflict') -or ($_.Contains('errors') -and $_.errors.Count -gt 0) }).Count -gt 0
        $state=@{schemaVersion=1;generatedAt=$Now.ToString('o');sourceListComplete=$true;discoveryComplete=($selected -eq $entries.Count);status=if ($partial -or $selected -lt $entries.Count) {'partial'} else {'complete'};config=$config;repositories=$rows}
        Write-ResearchJson $statePath $state
        Write-ResearchJson (Join-Path $directory 'git-sync.json') $state
        return $state
    } finally {
        if ($null -ne $lock) { $lock.Dispose() }
    }
}
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $result=Invoke-ResearchGitSync -ProjectRoot $ProjectRoot -Action $Action -Limit $Limit -Category $Category -TimeoutSeconds $TimeoutSeconds -Concurrency $Concurrency -Repository $Repository -NoAutoStash:$NoAutoStash -UsePrimaryBranch:$UsePrimaryBranch
        $result | ConvertTo-Json -Depth 20
        if ($result.status -eq 'partial') { exit 1 }
    } catch {
        $known=@('source_config_missing_run_sources_import','source_config_invalid','repository_url_invalid','repository_protocol_unsupported','research_input_invalid_or_oversized','source_list_limit','source_lists_disagree','source_loader_unverified','source_executable_line_rejected','source_lists_copy_failed_rolled_back','source_lists_rollback_failed','source_list_empty','clone_declaration_invalid','repository_path_collision','repository_path_invalid','category_invalid','repository_filter_invalid','auto_stash_invalid','git_state_missing','git_state_invalid','dotenv_unknown_teamagent_key','dotenv_invalid_assignment','dotenv_duplicate_key','dotenv_invalid_value','dotenv_unclosed_quote','dotenv_nested_quote_unsupported','dotenv_invalid_quote','cache_path_required','outdated_threshold_invalid','rename_prefix_invalid','rename_prefix_collision','backup_account_invalid','reparse_path_rejected','reparse_cache_rejected','path_outside_cache')
        $message=if ($_.Exception.Message -in $known) { $_.Exception.Message } else { 'git_maintenance_failed_or_locked' }
        [Console]::Error.WriteLine($message); exit 1
    }
}
