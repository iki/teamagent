/** Native Git opts into Windows long paths per command; repository/global config stays untouched. */
export function gitPlatformArguments(
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
): string[] {
  return platform === "win32" ? ["-c", "core.longpaths=true", ...args] : [...args];
}
