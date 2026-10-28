# Shared host helpers for bounded, noninteractive research maintenance.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:ResearchCategories = @('ai-agents','ai-agents-mem','ai-agents-proxy','ai-agents-sandbox','ai-agents-skills','ai-agents-swarm','ai-agents-tokens','ai-eval','ai-gen','ai-info','ai-media','ai-model-edit','ai-model-run','ai-operate','ai-prompts','ai-query','ai-security','ai-skills','ai-spec')
function ConvertTo-ResearchLfText {
    param([string]$Text)
    return $Text.Replace("`r`n","`n").Replace("`r","`n")
}
function Write-ResearchTextFile {
    param([string]$Path,[string]$Text)
    [IO.File]::WriteAllText($Path,(ConvertTo-ResearchLfText $Text),[Text.UTF8Encoding]::new($false))
}
function Write-ResearchJsonOutput {
    param([object]$Value)
    [Console]::Out.Write((ConvertTo-ResearchLfText ($Value | ConvertTo-Json -Depth 20))+"`n")
}
function Read-ResearchText {
    param([string]$Path, [int]$MaxBytes = 16777216)
    $item = Get-Item -LiteralPath $Path -Force
    if ($item.PSIsContainer -or $item.Length -gt $MaxBytes -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'research_input_invalid_or_oversized' }
    return [IO.File]::ReadAllText($item.FullName, [Text.UTF8Encoding]::new($false, $true))
}
function Get-ResearchSettings {
    param([string]$ProjectRoot)
    $root = [IO.Path]::GetFullPath($ProjectRoot)
    $values = @{
        TEAMAGENT_GIT_SOURCES_DIR=''; TEAMAGENT_GIT_CACHE='.cache/git'; TEAMAGENT_GIT_AUTO_STASH='true'; TEAMAGENT_GIT_OUTDATED_THRESHOLD='4m'
        TEAMAGENT_GIT_OUTDATED_PREFIX='xx-<YYMM>-'; TEAMAGENT_GIT_REMOVED_PREFIX='zz-<YYMM>-'; TEAMAGENT_GIT_BACKUP_ACCOUNT=''
        TEAMAGENT_REPOMIX_CACHE='.cache/git.repomix'; TEAMAGENT_TEXT_CACHE='.cache/text'
    }
    $defaults=$values.Clone()
    foreach ($name in @('.env','.env.local')) {
        $path = Join-Path $root $name
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        $envText=Read-ResearchText $path 65536
        if ($envText.Contains([char]0)) { throw 'dotenv_invalid_value' }
        foreach ($raw in $envText.TrimStart([char]0xFEFF) -split '\r?\n') {
            $line=$raw.Trim()
            if ($line -eq '' -or $line.StartsWith('#')) { continue }
            if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { throw 'dotenv_invalid_assignment' }
            $key=$Matches[1]; $value=$Matches[2].Trim()
            if ($key -cnotin @($values.Keys)) {
                if ($key.StartsWith('TEAMAGENT_')) { throw 'dotenv_unknown_teamagent_key' }
                continue
            }
            if (-not $seen.Add($key)) { throw 'dotenv_duplicate_key' }
            if ($value.StartsWith('"') -or $value.StartsWith("'")) {
                $quote=$value.Substring(0,1)
                if ($value.Length -lt 2 -or -not $value.EndsWith($quote)) { throw 'dotenv_unclosed_quote' }
                $value=$value.Substring(1,$value.Length-2)
                if ($value.Contains($quote)) { throw 'dotenv_nested_quote_unsupported' }
            } elseif ($value.Contains('"') -or $value.Contains("'")) { throw 'dotenv_invalid_quote' }
            if ($value -match '["''`$\x00-\x1f\x7f]') { throw 'dotenv_invalid_value' }
            $values[$key]=$value
        }
    }
    foreach ($key in $defaults.Keys) {
        if ($values[$key] -eq '') { $values[$key]=$defaults[$key] }
    }
    if ($values.TEAMAGENT_GIT_AUTO_STASH -cnotin @('true','false')) { throw 'auto_stash_invalid' }
    if ($values.TEAMAGENT_GIT_OUTDATED_THRESHOLD -notmatch '^[1-9][0-9]{0,3}[md]$') { throw 'outdated_threshold_invalid' }
    foreach ($key in @('TEAMAGENT_GIT_OUTDATED_PREFIX','TEAMAGENT_GIT_REMOVED_PREFIX')) {
        if ($values[$key] -notmatch '^[A-Za-z][A-Za-z0-9_-]{0,20}-<YYMM>-$') { throw 'rename_prefix_invalid' }
    }
    if ($values.TEAMAGENT_GIT_OUTDATED_PREFIX -eq $values.TEAMAGENT_GIT_REMOVED_PREFIX) { throw 'rename_prefix_collision' }
    if ($values.TEAMAGENT_GIT_BACKUP_ACCOUNT -ne '' -and $values.TEAMAGENT_GIT_BACKUP_ACCOUNT -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$') { throw 'backup_account_invalid' }
    $resolved=@{ ProjectRoot=$root; Values=$values }
    foreach ($pair in @(@('SourcesDirectory','TEAMAGENT_GIT_SOURCES_DIR'),@('GitCache','TEAMAGENT_GIT_CACHE'),@('RepomixCache','TEAMAGENT_REPOMIX_CACHE'),@('TextCache','TEAMAGENT_TEXT_CACHE'))) {
        $value=$values[$pair[1]]
        $resolved[$pair[0]]=if ($value -eq '') { '' } else { [IO.Path]::GetFullPath($value,$root) }
    }
    return $resolved
}
function Get-ResearchRelativePath {
    param([string]$Root,[string]$Path)
    return [IO.Path]::GetRelativePath($Root,$Path).Replace('\','/')
}
function Get-ResearchSafePath {
    param([string]$Root,[string]$Relative,[switch]$AllowRoot)
    $base=[IO.Path]::GetFullPath($Root); $full=[IO.Path]::GetFullPath($Relative,$base)
    $comparison=if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
    if (($full.Equals($base,$comparison) -and -not $AllowRoot) -or (-not $full.Equals($base,$comparison) -and -not $full.StartsWith($base.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar,$comparison))) { throw 'path_outside_cache' }
    $probe=$full
    while ($probe -ne '' -and -not $probe.Equals($base,$comparison)) {
        if (Test-Path -LiteralPath $probe) {
            if ((Get-Item -LiteralPath $probe -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'reparse_path_rejected' }
        }
        $probe=[IO.Path]::GetDirectoryName($probe)
    }
    $probe=$base
    while ($probe -ne '') {
        if ((Test-Path -LiteralPath $probe) -and ((Get-Item -LiteralPath $probe -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'reparse_cache_rejected' }
        $next=[IO.Path]::GetDirectoryName($probe)
        if ($null -eq $next -or $next -eq $probe) { break };$probe=$next
    }
    return $full
}
function Get-ResearchCanonicalUrl {
    param([string]$Url)
    if ($Url -match '^git@github\.com:([^\s]+)$') { $Url='https://github.com/'+$Matches[1] }
    $uri=$null
    if (-not [Uri]::TryCreate($Url,[UriKind]::Absolute,[ref]$uri) -or $uri.UserInfo -ne '' -or $uri.Query -ne '' -or $uri.Fragment -ne '') { throw 'repository_url_invalid' }
    if ($uri.Scheme -notin @('https','file')) { throw 'repository_protocol_unsupported' }
    if ($Url -match '[\x00-\x20\x7f''"<>]') { throw 'repository_url_invalid' }
    $canonical=$uri.AbsoluteUri.TrimEnd('/')
    if ($uri.Scheme -ne 'file') { $canonical=$canonical -replace '\.git$','' }
    if ($uri.Host -in @('github.com','gist.github.com')) { $canonical=$canonical.ToLowerInvariant() }
    return $canonical
}
function Get-ResearchBaseName {
    param([string]$Name,[hashtable]$Settings)
    foreach ($template in @($Settings.Values.TEAMAGENT_GIT_OUTDATED_PREFIX,$Settings.Values.TEAMAGENT_GIT_REMOVED_PREFIX,'xx-<YYMM>-','zz-<YYMM>-')) {
        $pattern='^'+[regex]::Escape($template).Replace('<YYMM>','[0-9]{4}')
        $Name=[regex]::Replace($Name,$pattern,'')
    }
    if ($Name -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$' -or $Name -in @('.','..')) { throw 'repository_name_invalid' }
    return $Name
}
function Get-ResearchSourceHeader {
    # Executable output comes only from repository-owned code, never an imported header.
    return (ConvertTo-ResearchLfText (Read-ResearchText (Join-Path $PSScriptRoot 'git-clone-header.sh') 65536)).TrimEnd()+"`n"
}
function Read-ResearchSourceConfiguration {
    param([hashtable]$Settings)
    $path=Get-ResearchSafePath $Settings.ProjectRoot 'git-sources.json'
    if (-not (Test-Path -LiteralPath $path)) { throw 'source_config_missing_run_sources_import' }
    $document=$null
    try {
        $options=[Text.Json.JsonDocumentOptions]::new();$options.MaxDepth=8
        $document=[Text.Json.JsonDocument]::Parse((Read-ResearchText $path),$options)
        $root=$document.RootElement
        if ($root.ValueKind -ne [Text.Json.JsonValueKind]::Object) { throw 'source_config_invalid' }
        $keys=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        foreach ($property in $root.EnumerateObject()) {
            if ($property.Name -cnotin @('schemaVersion','repositories') -or -not $keys.Add($property.Name)) { throw 'source_config_invalid' }
        }
        if ($keys.Count -ne 2 -or $root.GetProperty('schemaVersion').ValueKind -ne [Text.Json.JsonValueKind]::Number -or $root.GetProperty('schemaVersion').GetInt32() -ne 1) { throw 'source_config_invalid' }
        $repositories=$root.GetProperty('repositories')
        if ($repositories.ValueKind -ne [Text.Json.JsonValueKind]::Array -or $repositories.GetArrayLength() -lt 1 -or $repositories.GetArrayLength() -gt 10000) { throw 'source_config_invalid' }
        $rows=[Collections.Generic.List[object]]::new();$ids=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        foreach ($repository in $repositories.EnumerateArray()) {
            if ($repository.ValueKind -ne [Text.Json.JsonValueKind]::Object) { throw 'source_config_invalid' }
            $keys=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
            foreach ($property in $repository.EnumerateObject()) {
                if ($property.Name -cnotin @('category','name','url') -or $property.Value.ValueKind -ne [Text.Json.JsonValueKind]::String -or -not $keys.Add($property.Name)) { throw 'source_config_invalid' }
            }
            if ($keys.Count -ne 3) { throw 'source_config_invalid' }
            $category=$repository.GetProperty('category').GetString();$name=$repository.GetProperty('name').GetString();$url=Get-ResearchCanonicalUrl $repository.GetProperty('url').GetString()
            if ($category -cnotin $script:ResearchCategories -or (Get-ResearchBaseName $name $Settings) -cne $name) { throw 'source_config_invalid' }
            $id=$category+'--'+$name
            if (-not $ids.Add($id)) { throw 'repository_path_collision' }
            [void]$rows.Add(@{id=$id;category=$category;name=$name;sourcePath=$category+'/'+$name;url=$url})
        }
        return ,@($rows.ToArray() | Sort-Object category,name)
    } catch {
        throw 'source_config_invalid'
    } finally {
        if ($null -ne $document) { $document.Dispose() }
    }
}
function Read-ResearchSourceList {
    param([hashtable]$Settings,[switch]$Import)
    $Settings.SourceHeader=Get-ResearchSourceHeader
    $Settings.SourceWarnings=@()
    $Settings.SourceMode='owned_configuration'
    if (-not $Import -or $Settings.SourcesDirectory -eq '' -or $Settings.SourcesDirectory -eq $Settings.ProjectRoot) { return ,(Read-ResearchSourceConfiguration $Settings) }
    $Settings.SourceMode='external_declarations'
    $cloneText=Read-ResearchText (Join-Path $Settings.SourcesDirectory '.git-clone')
    if ($cloneText.Contains([char]0)) { throw 'clone_declaration_invalid' }
    $auxiliaryPath=Join-Path $Settings.SourcesDirectory '.git-sources'
    $sourceText=if (Test-Path -LiteralPath $auxiliaryPath) { Read-ResearchText $auxiliaryPath } else { '' }
    $known=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($raw in $sourceText -split '\r?\n') {
        $line=$raw.Trim()
        if ($line -ne '' -and -not $line.StartsWith('#')) { [void]$known.Add((Get-ResearchCanonicalUrl $line)) }
    }
    if ($known.Count -eq 0) { $Settings.SourceWarnings=@('auxiliary_source_list_empty_or_missing_validated_clone_declarations_used') }
    $rows=[Collections.Generic.List[object]]::new(); $paths=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $declarationsStarted=$false
    foreach ($raw in $cloneText -split '\r?\n') {
        $line=$raw.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { continue }
        if ($line -notmatch '^clone(?:\s|$)') {
            if ($declarationsStarted) { throw 'source_executable_line_rejected' }
            continue
        }
        $declarationsStarted=$true
        if ($line -notmatch '^clone\s+''([^'']+)''\s+''([^'']+)''\s*$') { throw 'clone_declaration_invalid' }
        $relative=$Matches[1].Replace('\','/'); $url=Get-ResearchCanonicalUrl $Matches[2]
        $parts=$relative.Split('/')
        if ($parts[0] -notin $script:ResearchCategories) { continue }
        if ($parts[0] -cnotin $script:ResearchCategories) { throw 'category_invalid' }
        if ($parts.Length -ne 2) { throw 'repository_path_invalid' }
        $name=Get-ResearchBaseName $parts[1] $Settings; $id=$parts[0]+'--'+$name
        if ($known.Count -gt 0 -and -not $known.Contains($url)) { throw 'source_lists_disagree' }
        if (-not $paths.Add($id)) { throw 'repository_path_collision' }
        [void]$rows.Add(@{id=$id;category=$parts[0];name=$name;sourcePath=$relative;url=$url})
        if ($rows.Count -gt 10000) { throw 'source_list_limit' }
    }
    if ($rows.Count -eq 0) { throw 'source_list_empty' }
    return ,@($rows.ToArray() | Sort-Object category,name)
}
function Get-ResearchCutoff {
    param([DateTimeOffset]$Now,[string]$Threshold)
    if ($Threshold -notmatch '^([1-9][0-9]{0,3})([md])$') { throw 'outdated_threshold_invalid' }
    $count=[int]$Matches[1]
    switch ($Matches[2]) {
        'd' { return $Now.AddDays(-$count) }
        'm' { return $Now.AddMonths(-$count) }
    }
}
function Write-ResearchJson {
    param([string]$Path,[object]$Value)
    $temporary=$Path+'.tmp-'+[Guid]::NewGuid().ToString('N')
    try {
        Write-ResearchTextFile $temporary (($Value | ConvertTo-Json -Depth 20)+"`n")
        [IO.File]::Move($temporary,$Path,$true)
    } finally { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary } }
}
# Fixed trusted host code drains both process streams with hard character limits.
if (-not ('TeamagentResearchProcess' -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
public static class TeamagentResearchProcess {
    private static async Task<string> Read(StreamReader reader, int limit) {
        var text = new StringBuilder(); var buffer = new char[2048];
        while (true) {
            var count = await reader.ReadAsync(buffer, 0, buffer.Length);
            if (count == 0) return text.ToString();
            if (text.Length + count > limit) throw new IOException("process_output_limit");
            text.Append(buffer, 0, count);
        }
    }
    public static string[] Run(ProcessStartInfo info, string input, int timeoutMs, int limit) {
        using (var process = new Process { StartInfo = info }) {
            process.Start();
            var stdout = Read(process.StandardOutput, limit);
            var stderr = Read(process.StandardError, limit);
            try {
                if (input != null) process.StandardInput.Write(input);
                process.StandardInput.Close();
                var all = Task.WhenAll(stdout, stderr, process.WaitForExitAsync().ContinueWith(_ => ""));
                var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
                while (!all.IsCompleted) {
                    if (stdout.IsFaulted || stderr.IsFaulted) throw new IOException("process_output_limit");
                    if (DateTime.UtcNow >= deadline) throw new TimeoutException("process_timeout");
                    Task.Delay(20).GetAwaiter().GetResult();
                }
                all.GetAwaiter().GetResult();
                return new[] { process.ExitCode.ToString(), stdout.Result, stderr.Result };
            } finally {
                if (!process.HasExited) { process.Kill(true); process.WaitForExit(5000); }
            }
        }
    }
}
"@
}
function Invoke-ResearchGit {
    param([string]$Directory,[string[]]$Arguments,[string]$InputText='',[int]$TimeoutSeconds=120)
    $command=Get-Command git -CommandType Application -ErrorAction Stop | Select-Object -First 1
    $info=[Diagnostics.ProcessStartInfo]::new(); $info.FileName=$command.Source
    $info.UseShellExecute=$false; $info.CreateNoWindow=$true
    $info.RedirectStandardInput=$true; $info.RedirectStandardOutput=$true; $info.RedirectStandardError=$true
    $info.StandardOutputEncoding=[Text.UTF8Encoding]::new($false,$true); $info.StandardErrorEncoding=[Text.UTF8Encoding]::new($false,$true)
    $info.WorkingDirectory=$Directory
    foreach ($value in @('-c',('safe.directory='+$Directory.Replace('\','/')),'-c','core.hooksPath=/dev/null','-c','submodule.recurse=false','-c','credential.interactive=false')+$Arguments) { $info.ArgumentList.Add($value) }
    $info.Environment['GIT_TERMINAL_PROMPT']='0'; $info.Environment['GCM_INTERACTIVE']='Never'
    $info.Environment['GIT_SSH_COMMAND']='ssh -oBatchMode=yes -oConnectTimeout=15'
    try {
        $result=[TeamagentResearchProcess]::Run($info,$InputText,$TimeoutSeconds*1000,4194304)
        return @{exitCode=[int]$result[0];stdout=$result[1];stderr=$result[2];error=''}
    } catch {
        $code=if ($_.Exception.ToString().Contains('process_output_limit')) { 'process_output_limit' } else { 'process_timeout_or_launch_failure' }
        return @{exitCode=-1;stdout='';stderr='';error=$code}
    }
}
function Get-ResearchGitHubCredential {
    param([string]$ProjectRoot)
    $result=Invoke-ResearchGit $ProjectRoot @('credential','fill') "protocol=https`nhost=github.com`n`n" 15
    if ($result.exitCode -ne 0) { return '' }
    foreach ($line in $result.stdout -split '\r?\n') { if ($line.StartsWith('password=')) { return $line.Substring(9) } }
    return ''
}
function Invoke-ResearchGitHub {
    param([string]$Endpoint,[string]$Token='',[string]$Method='GET',[object]$Body=$null)
    if ($Endpoint -notmatch '^/[A-Za-z0-9_./-]+$' -or $Endpoint -match '(^|/)\.\.(/|$)' -or $Method -notin @('GET','POST')) { throw 'github_request_invalid' }
    $handler=[Net.Http.HttpClientHandler]::new();$handler.AllowAutoRedirect=$false
    $client=[Net.Http.HttpClient]::new($handler);$cancel=[Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds(30))
    $request=[Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::new($Method),('https://api.github.com'+$Endpoint))
    $response=$null;$stream=$null;$buffered=[IO.MemoryStream]::new()
    try {
        [void]$request.Headers.TryAddWithoutValidation('Accept','application/vnd.github+json')
        [void]$request.Headers.TryAddWithoutValidation('X-GitHub-Api-Version','2022-11-28')
        [void]$request.Headers.TryAddWithoutValidation('User-Agent','teamagent-research-maintenance')
        if ($Token -ne '') { $request.Headers.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$Token) }
        if ($null -ne $Body) { $request.Content=[Net.Http.StringContent]::new((ConvertTo-Json -InputObject $Body -Compress),[Text.Encoding]::UTF8,'application/json') }
        $response=$client.SendAsync($request,[Net.Http.HttpCompletionOption]::ResponseHeadersRead,$cancel.Token).GetAwaiter().GetResult()
        $status=[int]$response.StatusCode
        if ($status -notin @(200,201)) { return @{status=$status;data=$null;error=''} }
        if ($response.Content.Headers.ContentLength -gt 1048576) { return @{status=0;data=$null;error='github_response_limit'} }
        $stream=$response.Content.ReadAsStreamAsync($cancel.Token).GetAwaiter().GetResult()
        $buffer=[byte[]]::new(8192)
        while ($true) {
            $count=$stream.ReadAsync($buffer,0,$buffer.Length,$cancel.Token).GetAwaiter().GetResult()
            if ($count -eq 0) { break }
            if ($buffered.Length+$count -gt 1048576) { return @{status=0;data=$null;error='github_response_limit'} }
            $buffered.Write($buffer,0,$count)
        }
        try {
            $text=[Text.UTF8Encoding]::new($false,$true).GetString($buffered.ToArray())
            $data=ConvertFrom-Json -InputObject $text -AsHashtable -Depth 20
        } catch { return @{status=0;data=$null;error='github_response_invalid'} }
        return @{status=$status;data=$data;error=''}
    } catch { return @{status=0;data=$null;error='github_transport_failed'} }
    finally { if ($null -ne $stream) { $stream.Dispose() };if ($null -ne $response) { $response.Dispose() };$request.Dispose();$buffered.Dispose();$cancel.Dispose();$client.Dispose();$handler.Dispose() }
}
