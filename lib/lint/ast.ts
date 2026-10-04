import type { ESTree } from "@oxlint/plugins";
import { Option } from "effect";

/** Static names only; dynamic keys need semantic analysis beyond this syntax guard. */
export function memberName(node: ESTree.MemberExpression): Option.Option<string> {
  if (!node.computed && node.property.type === "Identifier") return Option.some(node.property.name);
  if (node.computed && node.property.type === "Literal" && typeof node.property.value === "string")
    return Option.some(node.property.value);
  return Option.none();
}
