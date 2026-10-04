import { isAbsolute, relative, sep } from "node:path";

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

/** Inputs must already be canonical absolute paths. Windows comparisons follow its path semantics. */
export const pathsOverlap = (left: string, right: string): boolean =>
  contains(left, right) || contains(right, left);
