# Consume only explicitly reviewed portable analysis identities; never infer a URL rename.
function Test-ResearchIdentityUrlAlias {
    param([array]$Aliases,[string]$Url)
    foreach ($alias in $Aliases) {
        if ($alias -is [string] -and ($alias.StartsWith('https://',[StringComparison]::OrdinalIgnoreCase) -or $alias.StartsWith('file://',[StringComparison]::OrdinalIgnoreCase) -or $alias.StartsWith('git@github.com:',[StringComparison]::OrdinalIgnoreCase))) {
            if ((Get-ResearchCanonicalUrl $alias) -ceq $Url) { return $true }
        }
    }
    return $false
}
function Read-ResearchIdentityLedger {
    param([hashtable]$Settings)
    $path=Get-ResearchSafePath $Settings.ProjectRoot 'spec/analyses/state.json'
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    try { $ledger=ConvertFrom-Json (Read-ResearchText $path) -AsHashtable -Depth 20 } catch { throw 'analysis_identity_ledger_invalid' }
    if ($ledger -isnot [Collections.IDictionary] -or -not $ledger.Contains('schemaVersion') -or -not $ledger.Contains('records') -or -not $ledger.Contains('events') -or $ledger.schemaVersion -ne 1 -or $ledger.records -isnot [array] -or $ledger.records.Count -gt 10000 -or $ledger.events -isnot [array] -or $ledger.events.Count -gt 100000) { throw 'analysis_identity_ledger_invalid' }
    $ids=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($record in $ledger.records) {
        if ($record -isnot [Collections.IDictionary] -or -not $record.Contains('id') -or -not $record.Contains('url') -or -not $record.Contains('aliases') -or -not $record.Contains('analyzedSha') -or $record.id -isnot [string] -or $record.id -cnotmatch '^[a-z0-9.-]+--[a-z0-9._-]+$' -or -not $ids.Add($record.id) -or $record.url -isnot [string] -or $record.aliases -isnot [array] -or $record.aliases.Count -gt 256 -or ($null -ne $record.analyzedSha -and ($record.analyzedSha -isnot [string] -or $record.analyzedSha -cnotmatch '^(?:[a-f0-9]{40}|[a-f0-9]{64})$'))) { throw 'analysis_identity_ledger_invalid' }
        [void](Get-ResearchCanonicalUrl $record.url)
        foreach ($alias in $record.aliases) { if ($alias -isnot [string] -or $alias.Length -gt 2048) { throw 'analysis_identity_ledger_invalid' } }
    }
    return $ledger
}
function New-ResearchObservedIdentity {
    param([hashtable]$Entry,[hashtable]$Settings)
    return @{id=$Entry.id;category=$Entry.category;sourcePath=$Entry.sourcePath;url=$Entry.url;path=Get-ResearchRelativePath $Settings.ProjectRoot (Join-Path $Settings.GitCache $Entry.sourcePath);previousPath=$null;aliases=@();listed=$true;listStatus='listed';checkedThisRun=$false;checkedAt=$null;status='not_processed';lifecycle='unknown';availability='unknown';dirty=$null;shallow=$null;head=$null;upstreamHead=$null;lastCommitAt=$null;backup=@{status='not_attempted';url=$null};errors=@()}
}
function Get-ResearchIdentityHistory {
    param([hashtable]$Previous,[hashtable]$Target,[hashtable]$Settings)
    $history=[Collections.Generic.List[object]]::new()
    foreach ($row in @($Target,$Previous)) {
        if ($row.ContainsKey('previousIdentities')) {
            if ($row.previousIdentities -isnot [array]) { throw 'identity_history_invalid' }
            foreach ($old in $row.previousIdentities) { [void]$history.Add($old) }
        }
    }
    $retained=$Previous.Clone();[void]$retained.Remove('previousIdentities')
    [void]$history.Add($retained)
    Assert-ResearchIdentityHistory $history.ToArray() $Settings
    return ,$history.ToArray()
}
function Assert-ResearchIdentityHistory {
    param([object]$History,[hashtable]$Settings)
    if ($History -isnot [array]) { throw 'identity_history_invalid' }
    if ($History.Count -gt 16) { throw 'identity_history_limit' }
    $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($row in $History) {
        if ($row -isnot [Collections.IDictionary] -or $row.Contains('previousIdentities') -or -not $row.Contains('id') -or -not $row.Contains('url') -or -not $row.Contains('path') -or $row.id -isnot [string] -or $row.url -isnot [string] -or $row.path -isnot [string]) { throw 'identity_history_invalid' }
        $url=Get-ResearchCanonicalUrl $row.url
        if (-not $seen.Add($row.id+"`n"+$url)) { throw 'identity_history_collision' }
        $path=[IO.Path]::GetFullPath($row.path,$Settings.ProjectRoot)
        [void](Get-ResearchSafePath $Settings.GitCache ([IO.Path]::GetRelativePath($Settings.GitCache,$path)))
    }
    $bytes=[Text.Encoding]::UTF8.GetByteCount((ConvertTo-Json -InputObject $History -Depth 20 -Compress))
    if ($bytes -gt 1048576) { throw 'identity_history_limit' }
}
function Resolve-ResearchReviewedIdentities {
    param([array]$Rows,[array]$Entries,[hashtable]$Settings,[int]$TimeoutSeconds)
    $ledger=Read-ResearchIdentityLedger $Settings
    if ($null -eq $ledger) { return ,$Rows }
    $result=[Collections.Generic.List[object]]::new();foreach ($row in $Rows) { [void]$result.Add($row) }
    $targets=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($previous in $Rows) {
        $records=@($ledger.records | Where-Object { ($_.id -ceq $previous.id -or $_.aliases -ccontains $previous.id) -and (Test-ResearchIdentityUrlAlias $_.aliases $previous.url) -and (Get-ResearchCanonicalUrl $_.url) -cne $previous.url })
        if ($records.Count -eq 0) { continue }
        try {
            if ($records.Count -ne 1) { throw 'reviewed_identity_ambiguous' }
            $record=$records[0]
            $peers=@($Rows | Where-Object { ($_.id -ceq $record.id -or $record.aliases -ccontains $_.id) -and (Test-ResearchIdentityUrlAlias $record.aliases $_.url) -and (Get-ResearchCanonicalUrl $record.url) -cne $_.url })
            if ($peers.Count -ne 1) { throw 'reviewed_identity_ambiguous' }
            $matches=@($Entries | Where-Object { $_.url -ceq (Get-ResearchCanonicalUrl $record.url) -and $record.aliases -ccontains $_.id })
            if ($matches.Count -ne 1 -or $null -eq $record.analyzedSha) { throw 'reviewed_identity_target_unverified' }
            $entry=$matches[0]
            if (-not $targets.Add($entry.id)) { throw 'reviewed_identity_ambiguous' }
            $events=@($ledger.events | Where-Object { $_ -is [Collections.IDictionary] -and $_.Contains('id') -and $_.id -ceq $record.id -and $_.Contains('action') -and $_.action -ceq 'renamed' })
            if ($events.Count -eq 0) { throw 'reviewed_identity_event_missing' }
            $event=$events[-1]
            if (-not $event.Contains('sha') -or $event.sha -isnot [string] -or $event.sha -cnotmatch '^(?:[a-f0-9]{40}|[a-f0-9]{64})$' -or -not $event.Contains('previousSha') -or $event.previousSha -cne $event.sha -or -not $event.Contains('at')) { throw 'reviewed_identity_event_invalid' }
            $reviewAt=[DateTimeOffset]::MinValue
            if ($event.at -is [DateTimeOffset]) { $reviewAt=$event.at }
            elseif ($event.at -is [DateTime] -and $event.at.Kind -ne [DateTimeKind]::Unspecified) { $reviewAt=[DateTimeOffset]::new($event.at) }
            elseif ($event.at -isnot [string] -or $event.at -cnotmatch '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$' -or -not [DateTimeOffset]::TryParse($event.at,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::None,[ref]$reviewAt)) { throw 'reviewed_identity_event_invalid' }
            $existing=@($result | Where-Object { $_.id -ceq $entry.id -and $_.url -ceq $entry.url })
            if ($existing.Count -gt 1 -or @($result | Where-Object { $_.id -ceq $entry.id -and $_.url -cne $entry.url }).Count -gt 0) { throw 'reviewed_identity_ambiguous' }
            $target=if ($existing.Count -eq 1) { $existing[0] } else { New-ResearchObservedIdentity $entry $Settings }
            $path=Find-ResearchRepository $entry $target $Settings
            $oldPath=[IO.Path]::GetFullPath($previous.path,$Settings.ProjectRoot)
            if ((Test-Path -LiteralPath $oldPath) -and $oldPath -ne $path) { throw 'reviewed_identity_checkout_ambiguous' }
            $observed=Read-ResearchCheckout $path $entry.url $TimeoutSeconds -ReadOnly
            foreach ($sha in @($record.analyzedSha,$event.sha) | Select-Object -Unique) {
                $ancestor=Invoke-ResearchGit $path @('merge-base','--is-ancestor',$sha,$observed.head) '' $TimeoutSeconds -ReadOnly
                if ($ancestor.exitCode -ne 0) { throw 'reviewed_identity_ancestry_unverified' }
            }
            $history=Get-ResearchIdentityHistory $previous $target $Settings
            $target.path=Get-ResearchRelativePath $Settings.ProjectRoot $path
            $target.previousIdentities=$history
            $target.identityReconciliation=@{status='reviewed';recordId=$record.id;previousId=$previous.id;previousUrl=$previous.url;url=$entry.url;analyzedSha=$record.analyzedSha;renameSha=$event.sha;reviewedAt=$reviewAt.ToString('o');ancestryVerified=$true}
            if ($existing.Count -eq 0) { [void]$result.Add($target) }
            [void]$result.Remove($previous)
        } catch {
            $known=@('reviewed_identity_ambiguous','reviewed_identity_target_unverified','reviewed_identity_event_missing','reviewed_identity_event_invalid','reviewed_identity_checkout_ambiguous','reviewed_identity_ancestry_unverified','repository_alias_collision','repository_not_standalone_checkout','repository_origin_mismatch','repository_inspection_failed','identity_history_invalid','identity_history_limit','identity_history_collision','reparse_path_rejected','reparse_cache_rejected','path_outside_cache')
            $reason=if ($_.Exception.Message -in $known) { $_.Exception.Message } else { 'reviewed_identity_unverified' }
            $previous.identityReconciliation=@{status='unverified';reason=$reason}
        }
    }
    return ,$result.ToArray()
}
