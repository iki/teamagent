import { posix, win32 } from "node:path";

/** Rebase absolute file references to spec/.conversations; preserve web URLs and relative paths. */
export function relativeReferences(text: string, root: string, previousRoot?: string): string {
  const paths = /^[a-z]:[\\/]/i.test(root) ? win32 : posix;
  const base = paths.join(root, "spec", ".conversations");
  function convert(input: string): string {
    let path = input.replace(/^file:\/\/(?:\/([a-z]:))?/i, "$1").replace(/\\+/g, "/");
    try {
      path = decodeURIComponent(path);
    } catch {
      /* Literal percent signs are valid in file names. */
    }
    const suffix = path.match(/(?::\d+(?::\d+)?|#[^\s]*)$/)?.[0] ?? "";
    if (suffix) path = path.slice(0, -suffix.length);
    if (previousRoot) {
      const old = previousRoot.replace(/\\+/g, "/").replace(/\/$/, "");
      const compare = paths === win32 ? path.toLowerCase() : path;
      const prefix = paths === win32 ? old.toLowerCase() : old;
      if (compare === prefix || compare.startsWith(`${prefix}/`))
        path = root.replace(/\\/g, "/") + path.slice(old.length);
    }
    const relative = paths.relative(base, path).replace(/\\/g, "/");
    return paths.isAbsolute(relative)
      ? `external-file-${paths.basename(path)}${suffix}`
      : `${relative || "."}${suffix}`;
  }
  const isFile = (value: string): boolean => {
    if (/^(?:[a-z]:[\\/]|file:\/\/)/i.test(value)) return true;
    // Leading slashes also identify API routes and site-root links. Only rebase
    // a POSIX reference when its checkout root makes the file meaning explicit.
    return [root, previousRoot].some((checkout) => {
      if (!checkout?.startsWith("/")) return false;
      const prefix = checkout.replace(/\/$/, "");
      return value === prefix || value.startsWith(`${prefix}/`);
    });
  };
  let result = text.replace(
    /\]\((<?)([^)\n]+?)>?\)/g,
    (whole: string, _angle: string, target: string) => {
      if (!isFile(target)) return whole;
      const relative = convert(target);
      return `](${/\s/.test(relative) ? `<${relative}>` : relative})`;
    },
  );
  result = result.replace(
    /([`"'])([^`"'\r\n]+)\1/g,
    (whole: string, quote: string, value: string) =>
      isFile(value) ? `${quote}${convert(value)}${quote}` : whole,
  );
  return result.replace(
    /(?<![\w.:/\\])(?:file:\/\/\/|[a-z]:[\\/]|\/(?!\/)[\w.-]+\/)[^\s<>`"'(){};,]+/gi,
    (path) => {
      const withoutPunctuation = path.replace(/[.!?]$/, "");
      return isFile(withoutPunctuation)
        ? convert(withoutPunctuation) + (path.match(/[.!?]$/)?.[0] ?? "")
        : path;
    },
  );
}
