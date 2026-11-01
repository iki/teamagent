# Recovery operations retain exact commit/stash identities and never discard a stash.
function Write-ResearchRecovery {
    param([hashtable]$Settings,[hashtable]$Record)
    $path=Get-ResearchSafePath $Settings.ProjectRoot $Record.journal
    Write-ResearchJson $path $Record
}
function New-ResearchRecovery {
    param([hashtable]$Entry,[string]$Path,[hashtable]$Settings,[string]$Head,[DateTimeOffset]$Now)
    $directory=Get-ResearchSafePath $Settings.ProjectRoot '.cache/research/recovery'
    [void][IO.Directory]::CreateDirectory($directory)
    $nonce=[Guid]::NewGuid().ToString('N')
    $label='teamagent-sync-'+$Now.ToString('yyyyMMddTHHmmssZ')+'-'+$nonce
    $record=@{schemaVersion=1;id=$Entry.id;url=$Entry.url;path=Get-ResearchRelativePath $Settings.ProjectRoot $Path;createdAt=$Now.ToString('o');beforeHead=$Head;label=$label;journal='.cache/research/recovery/'+$nonce+'.json';status='planned';stashOid=$null;recoveryRef=$null;targetBranch=$null;errors=@()}
    Write-ResearchRecovery $Settings $record
    return $record
}
function Get-ResearchBranchDistance {
    param([string]$Path,[string]$LocalRef,[string]$RemoteRef,[int]$TimeoutSeconds)
    $result=Invoke-ResearchGit $Path @('rev-list','--left-right','--count',($LocalRef+'...'+$RemoteRef)) '' $TimeoutSeconds -ReadOnly
    if ($result.exitCode -ne 0 -or $result.stdout.Trim() -notmatch '^([0-9]+)\s+([0-9]+)$') { return @{status='blocked';reason='branch_distance_unverified'} }
    if ([long]$Matches[1] -gt 0) { return @{status=if ([long]$Matches[2] -gt 0) {'diverged'} else {'ahead'};reason='local_commits_preserved'} }
    return @{status='ready';reason='';ahead=[long]$Matches[1];behind=[long]$Matches[2]}
}
function Get-ResearchFastForwardDiagnostic {
    param([hashtable]$Command)
    # Git filters can print arbitrary private payloads. Retain only hashes, counts,
    # fixed classifications and static guidance, following the dependency runner.
    $output=[Text.Encoding]::UTF8.GetBytes($Command.stdout)
    $errors=[Text.Encoding]::UTF8.GetBytes($Command.stderr)
    $signals=[Collections.Generic.List[object]]::new()
    foreach ($signal in @(
        @{code='invalid_path';pattern='(?im)\b(?:error|fatal): invalid path\b';message='An upstream path cannot be checked out on this platform. Inspect committed paths without resetting the checkout.'},
        @{code='lock_unavailable';pattern='(?im)(?:unable to create[^\n]*\.lock|cannot lock ref|could not lock)';message='Git could not acquire a lock. Inspect its owner; do not delete a lock based on age alone.'},
        @{code='path_write_failed';pattern='(?im)(?:unable to (?:create|unlink|write)|cannot (?:create|unlink|write))[^\n]*(?:permission denied|access is denied|invalid argument|filename too long)';message='A checkout path could not be written. Inspect permissions, open handles and platform path limits.'},
        @{code='local_changes_obstruct_update';pattern='(?im)(?:local changes|untracked working tree files)[^\n]*would be overwritten';message='Local content obstructs the update. Preserve it and inspect the checkout before another attempt.'},
        @{code='fast_forward_rejected';pattern='(?im)(?:not possible to fast-forward|refusing to merge unrelated histories)';message='Git rejected fast-forwarding. The independently checked branch distance determines whether history diverged.'},
        @{code='filter_failed';pattern='(?im)(?:smudge filter[^\n]*failed|external filter[^\n]*failed)';message='A checkout filter failed. Inspect the configured filter and its required resources; captured filter payloads are omitted.'},
        @{code='index_write_failed';pattern='(?im)(?:could not|unable to) write (?:new )?index file';message='Git could not write the index. Inspect locks, storage and permissions before another attempt.'}
    )) {
        if ($Command.stderr -match $signal.pattern) { [void]$signals.Add(@{code=$signal.code;message=$signal.message}) }
    }
    $outcome=switch ($Command.error) {
        '' { 'exited' }
        'process_output_limit' { 'output-limit' }
        'process_timeout_or_launch_failure' { 'timeout-or-launch-failure' }
        default { 'transport-failure' }
    }
    return @{schemaVersion=1;operation='fast_forward';outcome=$outcome;exitCode=if ($Command.exitCode -ge 0) {$Command.exitCode} else {$null};captureComplete=($Command.error -eq '');fingerprintEncoding='UTF-8 re-encoded captured text; native stream bytes and any consumed BOM are not retained';stdoutBytes=$output.Length;stderrBytes=$errors.Length;stdoutSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($output)).ToLowerInvariant();stderrSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($errors)).ToLowerInvariant();signals=$signals.ToArray();message='The operation did not report success. No retry was made; inspect retained HEAD and upstream state before another attempt. Raw output is omitted to protect credentials and private filter content.'}
}
function Update-ResearchCheckout {
    param([hashtable]$Entry,[string]$Path,[hashtable]$Settings,[hashtable]$Available,[DateTimeOffset]$Now,[int]$TimeoutSeconds)
    $result=@{status='blocked';errors=@();recovery=$null}
    $record=$null;$restoreNeeded=$false
    try {
        $before=Read-ResearchCheckout $Path $Entry.url $TimeoutSeconds
        if ($before.dirty -isnot [bool]) { $result.errors=@('checkout_cleanliness_unverified');return $result }
        if ($null -eq $before.head) { $result.errors=@('checkout_head_unverified');return $result }
        $branch=Invoke-ResearchGit $Path @('symbolic-ref','--quiet','--short','HEAD') '' $TimeoutSeconds
        $detached=$branch.exitCode -eq 1
        if ($branch.exitCode -notin @(0,1)) { $result.errors=@('branch_inspection_failed');return $result }
        $switchPrimary=$detached;$missingUpstream=$false;$sourceUpstream=$null
        if (-not $detached) {
            $tracking=Invoke-ResearchGit $Path @('rev-parse','--symbolic-full-name','@{upstream}') '' $TimeoutSeconds
            if ($tracking.exitCode -ne 0) {
                $configured=Invoke-ResearchGit $Path @('for-each-ref','--format=%(upstream)',('refs/heads/'+$branch.stdout.Trim())) '' $TimeoutSeconds
                if ($configured.exitCode -ne 0) { $result.errors=@('branch_tracking_unverified');return $result }
                $remoteConfig=Invoke-ResearchGit $Path @('config','--get',('branch.'+$branch.stdout.Trim()+'.remote')) '' $TimeoutSeconds
                if ($remoteConfig.exitCode -notin @(0,1)) { $result.errors=@('branch_tracking_unverified');return $result }
                if ($remoteConfig.exitCode -eq 0 -and $remoteConfig.stdout.Trim() -ne 'origin') { $result.errors=@('tracking_remote_not_origin');return $result }
                $sourceUpstream=$configured.stdout.Trim()
                if ($sourceUpstream -ne '') {
                    if ($remoteConfig.exitCode -ne 0 -or -not $sourceUpstream.StartsWith('refs/remotes/origin/')) { $result.errors=@('branch_tracking_unverified');return $result }
                    $upstreamExists=Invoke-ResearchGit $Path @('show-ref','--verify','--quiet',$sourceUpstream) '' $TimeoutSeconds
                    if ($upstreamExists.exitCode -ne 1) { $result.errors=@('branch_tracking_unverified');return $result }
                    $missingUpstream=$true
                }
                if ($Settings.ContainsKey('UsePrimaryBranch') -and $Settings.UsePrimaryBranch -eq $true) { $switchPrimary=$true }
                else { $result.errors=@(if ($missingUpstream) {'upstream_branch_missing'} else {'untracked_branch'});return $result }
            } elseif (-not $tracking.stdout.Trim().StartsWith('refs/remotes/origin/')) { $result.errors=@('tracking_remote_not_origin');return $result }
        }

        $newPrimary=$false;$alreadyCurrent=$false;$primary='';$upstream=''
        if ($switchPrimary) {
            $default=Invoke-ResearchGit $Path @('symbolic-ref','--quiet','refs/remotes/origin/HEAD') '' $TimeoutSeconds
            if ($default.exitCode -eq 0 -and $default.stdout.Trim().StartsWith('refs/remotes/origin/')) { $upstream=$default.stdout.Trim() }
            # ls-remote is authoritative if the cached origin/HEAD points at an older default.
            if ($Available.branch -is [string] -and $Available.branch.StartsWith('refs/heads/')) { $upstream='refs/remotes/origin/'+$Available.branch.Substring(11) }
            if ($upstream -eq '') { $result.errors=@('remote_default_branch_unverified');return $result }
            $primary=$upstream.Substring(20)
            $valid=Invoke-ResearchGit $Path @('check-ref-format','--branch',$primary) '' $TimeoutSeconds
            $remote=Invoke-ResearchGit $Path @('rev-parse','--verify',$upstream) '' $TimeoutSeconds
            if ($valid.exitCode -ne 0 -or $remote.exitCode -ne 0) { $result.errors=@('remote_default_branch_unverified');return $result }
            $local=Invoke-ResearchGit $Path @('show-ref','--verify','--quiet',('refs/heads/'+$primary)) '' $TimeoutSeconds
            if ($local.exitCode -eq 0) {
                $tracking=Invoke-ResearchGit $Path @('rev-parse','--symbolic-full-name',($primary+'@{upstream}')) '' $TimeoutSeconds
                if ($tracking.exitCode -ne 0 -or $tracking.stdout.Trim() -ne $upstream) { $result.errors=@('primary_branch_tracking_mismatch');return $result }
                $distance=Get-ResearchBranchDistance $Path ('refs/heads/'+$primary) $upstream $TimeoutSeconds
                if ($distance.status -ne 'ready') { $result.status=$distance.status;$result.errors=@($distance.reason);return $result }
            } elseif ($local.exitCode -eq 1) { $newPrimary=$true }
            else { $result.errors=@('primary_branch_unverified');return $result }
        } else {
            $upstream=$tracking.stdout.Trim()
            $distance=Get-ResearchBranchDistance $Path 'HEAD' $upstream $TimeoutSeconds
            if ($distance.status -ne 'ready') { $result.status=$distance.status;$result.errors=@($distance.reason);return $result }
            $alreadyCurrent=$distance.behind -eq 0
        }
        if ($before.dirty -and $Settings.Values.TEAMAGENT_GIT_AUTO_STASH -ne 'true') { $result.status='dirty';return $result }
        if ($alreadyCurrent) {
            $result.status=if ($before.dirty) {'unchanged_with_local_changes'} else {'unchanged'}
            return $result
        }
        if ($before.dirty -or $switchPrimary) {
            $record=New-ResearchRecovery $Entry $Path $Settings $before.head $Now
            $record.targetBranch=if ($switchPrimary) {$primary} else {$branch.stdout.Trim()}
            $record.sourceBranch=if ($detached) {$null} else {$branch.stdout.Trim()}
            $record.sourceUpstream=$sourceUpstream
            $record.reason=if ($detached) {'detached_primary_recovery'} elseif ($missingUpstream) {'missing_upstream_primary_opt_in'} elseif ($switchPrimary) {'untracked_primary_opt_in'} else {'tracked_update'}
            if ($switchPrimary) {
                $recoveryName='teamagent/recovery/'+$record.label
                # The recovery branch pins the exact original commit; original commits are never replayed.
                $saved=Invoke-ResearchGit $Path @('branch',$recoveryName,$before.head) '' $TimeoutSeconds
                if ($saved.exitCode -ne 0) { $record.status='failed';$record.errors=@('head_recovery_ref_failed');Write-ResearchRecovery $Settings $record;$result.errors=$record.errors;return $result }
                $record.recoveryRef='refs/heads/'+$recoveryName;$record.status='original_head_preserved'
                Write-ResearchRecovery $Settings $record
            }
        }
        if ($before.dirty) {
            $previous=Invoke-ResearchGit $Path @('rev-parse','--verify','refs/stash') '' $TimeoutSeconds
            $record.status='stash_requested';Write-ResearchRecovery $Settings $record
            $stash=Invoke-ResearchGit $Path @('stash','push','--include-untracked','--message',$record.label) '' $TimeoutSeconds
            $created=Invoke-ResearchGit $Path @('rev-parse','--verify','refs/stash') '' $TimeoutSeconds
            if ($created.exitCode -eq 0 -and $created.stdout.Trim() -match '^(?:[a-f0-9]{40}|[a-f0-9]{64})$' -and ($previous.exitCode -ne 0 -or $previous.stdout.Trim() -ne $created.stdout.Trim())) {
                $subject=Invoke-ResearchGit $Path @('show','-s','--format=%s',$created.stdout.Trim()) '' $TimeoutSeconds
                if ($subject.exitCode -eq 0 -and $subject.stdout.Trim().EndsWith($record.label)) {
                    $record.stashOid=$created.stdout.Trim();$record.status='stash_preserved';$restoreNeeded=$true
                    Write-ResearchRecovery $Settings $record
                }
            }
            if ($stash.exitCode -ne 0 -or -not $restoreNeeded) { $result.errors=@('stash_creation_unverified');return $result }
        }
        $clean=Read-ResearchCheckout $Path $Entry.url $TimeoutSeconds
        if ($clean.dirty -ne $false -or $clean.head -ne $before.head) { $result.errors=@('checkout_changed_before_update');return $result }
        if ($switchPrimary) {
            $arguments=if ($newPrimary) {@('checkout','--no-overwrite-ignore','--track','-b',$primary,$upstream)} else {@('checkout','--no-overwrite-ignore',$primary)}
            $checkout=Invoke-ResearchGit $Path $arguments '' $TimeoutSeconds
            if ($checkout.exitCode -ne 0) { $result.errors=@('primary_checkout_failed');return $result }
            $record.status='primary_checked_out';Write-ResearchRecovery $Settings $record
        }
        $merge=Invoke-ResearchGit $Path @('merge','--ff-only','--no-edit','--no-overwrite-ignore',$upstream) '' $TimeoutSeconds
        if ($merge.exitCode -ne 0) {
            # A failed checkout/lock/filter or an uncertain transport is not proof
            # of divergent history. Recheck ancestry without retrying the mutation.
            $failedDistance=Get-ResearchBranchDistance $Path 'HEAD' $upstream $TimeoutSeconds
            $result.status=if ($failedDistance.status -in @('ahead','diverged')) {$failedDistance.status} else {'error'}
            $result.errors=@(if ($merge.exitCode -lt 0) {'fast_forward_outcome_uncertain'} else {'fast_forward_operation_failed'})
            if ($failedDistance.reason -ne '') { $result.errors+=@($failedDistance.reason) }
            if ($null -eq $record) {
                $record=New-ResearchRecovery $Entry $Path $Settings $before.head $Now
                $record.reason='tracked_update_failure';$record.sourceBranch=$branch.stdout.Trim();$record.targetBranch=$branch.stdout.Trim()
            }
            $record.status=if ($merge.exitCode -lt 0) {'fast_forward_uncertain'} else {'fast_forward_failed'};$record.targetUpstream=$upstream
            $record.fastForward=Get-ResearchFastForwardDiagnostic $merge
            $record.fastForward.branchDistance=$failedDistance
            return $result
        }
        $after=Read-ResearchCheckout $Path $Entry.url $TimeoutSeconds
        $result.status=if ($after.head -eq $before.head -and -not $switchPrimary) {'unchanged'} else {'updated'}
        if ($null -ne $record) { $record.status='updated';$record.afterHead=$after.head;Write-ResearchRecovery $Settings $record }
    } catch { $result.status='error';$result.errors=@('checkout_recovery_operation_failed') }
    finally {
        if ($restoreNeeded -and $null -ne $record -and $null -ne $record.stashOid) {
            # Retain the exact recovery object, even after a successful application.
            $apply=Invoke-ResearchGit $Path @('stash','apply','--index',$record.stashOid) '' $TimeoutSeconds
            if ($apply.exitCode -eq 0) {
                $record.status='restored_stash_retained'
                if ($result.status -in @('updated','unchanged')) { $result.status+='_with_local_changes' }
            } else {
                $record.status='stash_apply_conflict';$record.errors+=@('stash_apply_conflict_or_failure')
                $result.status='stash_conflict';$result.errors+=@('stash_apply_conflict_or_failure')
            }
        }
        if ($null -ne $record) {
            $record.errors=@($record.errors+$result.errors | Select-Object -Unique)
            try { Write-ResearchRecovery $Settings $record } catch { $result.status='error';$result.errors+=@('recovery_journal_write_failed') }
            $result.recovery=$record
        }
    }
    return $result
}
