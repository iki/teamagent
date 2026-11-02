#!/usr/bin/env bash
set -euo pipefail

# Teamagent source loader v1. Parse bounded literal data; never source or evaluate dotenv.
case ${BASH_SOURCE[0]} in */*) script_parent=${BASH_SOURCE[0]%/*} ;; *) script_parent=. ;; esac
script_dir=$(cd -- "$script_parent" && pwd -P)
declare -A settings=(
  [TEAMAGENT_GIT_SOURCES_DIR]='' [TEAMAGENT_GIT_CACHE]='.cache/git' [TEAMAGENT_GIT_AUTO_STASH]='true'
  [TEAMAGENT_GIT_OUTDATED_THRESHOLD]='4m' [TEAMAGENT_GIT_OUTDATED_PREFIX]='xx-<YYMM>-'
  [TEAMAGENT_GIT_REMOVED_PREFIX]='zz-<YYMM>-' [TEAMAGENT_GIT_BACKUP_ACCOUNT]=''
  [TEAMAGENT_REPOMIX_CACHE]='.cache/git.repomix' [TEAMAGENT_TEXT_CACHE]='.cache/text'
)
fail() { printf '%s\n' "$1" >&2; exit 2; }
# Select for the Git executable, not Bash's POSIX redirection semantics.
git_version=$(git --version) || fail git_version_unavailable
git_null_device=/dev/null
case "$git_version" in *'.windows.'*) git_null_device=NUL ;; esac
for env_name in .env .env.local; do
  env_path=$script_dir/$env_name
  [[ ! -L "$env_path" ]] || fail dotenv_symlink_rejected
  [[ -e "$env_path" ]] || continue
  [[ -f "$env_path" ]] || fail dotenv_file_invalid
  # read -N under the byte locale bounds memory and rejects NUL (Bash cannot store it).
  env_data=''
  IFS= LC_ALL=C read -r -d '' -n 65537 env_data < "$env_path" && fail dotenv_invalid_value
  [[ ${#env_data} -le 65536 ]] || fail dotenv_oversized
  env_data=${env_data#$'\xef\xbb\xbf'}
  declare -A seen=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    line=${line%$'\r'}
    line=${line#"${line%%[!$' \t']*}"}; line=${line%"${line##*[!$' \t']}"}
    [[ -n "$line" && "$line" != \#* ]] || continue
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]] || fail dotenv_invalid_assignment
    key=${BASH_REMATCH[1]}; value=${BASH_REMATCH[2]}
    case "$key" in
      TEAMAGENT_GIT_SOURCES_DIR|TEAMAGENT_GIT_CACHE|TEAMAGENT_GIT_AUTO_STASH|TEAMAGENT_GIT_OUTDATED_THRESHOLD|TEAMAGENT_GIT_OUTDATED_PREFIX|TEAMAGENT_GIT_REMOVED_PREFIX|TEAMAGENT_GIT_BACKUP_ACCOUNT|TEAMAGENT_REPOMIX_CACHE|TEAMAGENT_TEXT_CACHE) ;;
      TEAMAGENT_*) fail dotenv_unknown_teamagent_key ;;
      *) continue ;;
    esac
    [[ ! ${seen[$key]+present} ]] || fail dotenv_duplicate_key
    seen[$key]=1
    value=${value#"${value%%[!$' \t']*}"}; value=${value%"${value##*[!$' \t']}"}
    if [[ "$value" == \"* || "$value" == \'* ]]; then
      quote=${value:0:1}
      [[ ${#value} -ge 2 && "${value: -1}" == "$quote" ]] || fail dotenv_unclosed_quote
      value=${value:1:${#value}-2}
    fi
    [[ "$value" != *\"* && "$value" != *\'* && "$value" != *'`'* && "$value" != *'$'* && ! "$value" =~ [[:cntrl:]] ]] || fail dotenv_invalid_value
    settings[$key]=$value
  done <<< "$env_data"
done
auto_stash=${settings[TEAMAGENT_GIT_AUTO_STASH]:-true}
[[ "$auto_stash" == true || "$auto_stash" == false ]] || fail auto_stash_invalid
threshold=${settings[TEAMAGENT_GIT_OUTDATED_THRESHOLD]:-4m}
outdated_prefix=${settings[TEAMAGENT_GIT_OUTDATED_PREFIX]:-xx-<YYMM>-}
removed_prefix=${settings[TEAMAGENT_GIT_REMOVED_PREFIX]:-zz-<YYMM>-}
backup_account=${settings[TEAMAGENT_GIT_BACKUP_ACCOUNT]}
[[ "$threshold" =~ ^[1-9][0-9]{0,3}[md]$ ]] || fail outdated_threshold_invalid
prefix_pattern='^[A-Za-z][A-Za-z0-9_-]{0,20}-<YYMM>-$'
[[ "$outdated_prefix" =~ $prefix_pattern && "$removed_prefix" =~ $prefix_pattern ]] || fail rename_prefix_invalid
[[ "$outdated_prefix" != "$removed_prefix" ]] || fail rename_prefix_collision
[[ -z "$backup_account" || "$backup_account" =~ ^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$ ]] || fail backup_account_invalid
git_cache=${settings[TEAMAGENT_GIT_CACHE]:-.cache/git}
git_cache=${git_cache//\\//}
case "$git_cache" in /*|[A-Za-z]:/*) cache_root=$git_cache ;; *) cache_root=$script_dir/$git_cache ;; esac

base_name() {
  local name=$1 template prefix pattern
  for template in "$outdated_prefix" "$removed_prefix" 'xx-<YYMM>-' 'zz-<YYMM>-'; do
    prefix=${template%'<YYMM>-'}
    pattern="^${prefix}[0-9]{4}-(.+)$"
    [[ ! "$name" =~ $pattern ]] || name=${BASH_REMATCH[1]}
  done
  REPLY=$name
}
canonical_url() {
  local url=$1
  case "$url" in git@github.com:*) url=https://github.com/${url#git@github.com:} ;; esac
  while [[ "$url" == */ ]]; do url=${url%/}; done
  case "${url,,}" in https://github.com/*|https://gist.github.com/*) url=${url,,} ;; esac
  [[ "$url" == file:* ]] || url=${url%.git}
  REPLY=$url
}
clone() {
  [[ $# -eq 2 && -n "$1" && -n "$2" ]] || fail clone_arguments_invalid
  local relative=${1//\\//} target part probe parent candidate candidate_name requested_name origin wanted_url
  case "$relative" in /*|*:*|*//*|*/|'' ) fail clone_path_invalid ;; esac
  local -a segments matches=()
  IFS=/ read -r -a segments <<< "$relative"
  probe=$cache_root
  while [[ -n "$probe" ]]; do
    [[ ! -L "$probe" ]] || fail clone_symlink_rejected
    [[ "$probe" == */* && "$probe" != / ]] || break
    probe=${probe%/*}
  done
  probe=$cache_root
  for part in "${segments[@]}"; do
    [[ "$part" != . && "$part" != .. && -n "$part" ]] || fail clone_path_invalid
    probe=$probe/$part
    [[ ! -L "$probe" ]] || fail clone_symlink_rejected
  done
  target=$cache_root/$relative;parent=${target%/*}
  base_name "${relative##*/}";requested_name=$REPLY
  canonical_url "$2";wanted_url=$REPLY
  # Prefix maintenance can move a checkout while the source declaration stays unchanged.
  for candidate in "$parent"/* "$parent"/.[!.]* "$parent"/..?*; do
    [[ -e "$candidate" || -L "$candidate" ]] || continue
    candidate_name=${candidate##*/};base_name "$candidate_name"
    [[ "$REPLY" == "$requested_name" ]] || continue
    [[ ! -L "$candidate" && -d "$candidate/.git" && ! -L "$candidate/.git" ]] || fail clone_alias_not_standalone_repository
    origin=$(git -c "safe.directory=$candidate" -C "$candidate" remote get-url origin 2>/dev/null) || fail clone_origin_unverified
    canonical_url "$origin"
    [[ "$REPLY" == "$wanted_url" ]] || fail clone_alias_origin_mismatch
    matches+=("$candidate")
  done
  [[ ${#matches[@]} -le 1 ]] || fail clone_alias_ambiguous
  if [[ ${#matches[@]} -eq 1 ]]; then
    printf 'Existing repository: %s\n' "${matches[0]#"$cache_root"/}" >&2
  else
    GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=Never git -c credential.interactive=false -c "core.hooksPath=$git_null_device" clone --no-recurse-submodules -- "$2" "$target"
  fi
}
