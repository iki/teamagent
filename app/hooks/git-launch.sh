#!/bin/sh
set -eu

runtime="$(git config --local --get teamagent.bunPath)" || {
  printf '%s\n' 'Missing repository Bun configuration; install the repository Git hooks.' >&2
  exit 1
}
if [ -z "$runtime" ]; then
  printf '%s\n' 'The repository Bun path must not be empty.' >&2
  exit 1
fi
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    exec pwsh -NoLogo -NoProfile -NonInteractive -File "$root/app/toolchain.ps1" -Tool bun -ConfiguredBunPath "$runtime" "$root/app/hooks/git-launch.ts" "$hook" "$@"
    ;;
esac

# The installed configuration is canonical. Never execute a PATH fallback or a
# linked/shim runtime merely to discover which executable it would launch.
case "$runtime" in
  /*/bun) ;;
  *) printf '%s\n' 'The repository Bun path must name an absolute physical Bun executable.' >&2; exit 1 ;;
esac
case "$runtime" in
  */[sS][hH][iI][mM]/*|*/[sS][hH][iI][mM][sS]/*|*/.[sS][hH][iI][mM]/*|*/.[sS][hH][iI][mM][sS]/*)
    printf '%s\n' 'Refusing a Bun shim in the repository hook configuration.' >&2
    exit 1
    ;;
esac
if [ ! -f "$runtime" ] || [ ! -x "$runtime" ] || [ -L "$runtime" ]; then
  printf '%s\n' 'The repository Bun executable must be a regular, executable, unlinked file.' >&2
  exit 1
fi
runtime_directory="${runtime%/*}"
physical_directory="$(CDPATH= cd -P "$runtime_directory" && pwd -P)"
if [ "$physical_directory" != "$runtime_directory" ]; then
  printf '%s\n' 'The repository Bun path must use its canonical parent directory.' >&2
  exit 1
fi
exec "$runtime" "$root/app/hooks/git-launch.ts" "$hook" "$@"
