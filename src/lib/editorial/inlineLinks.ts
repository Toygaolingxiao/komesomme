export type InlinePart =
  | { type: "text"; text: string }
  | { type: "link"; label: string; href: string };

/** Internal library paths, or https sources. Anything else stays plain text. */
const INLINE_LINK =
  /\[([^\]\n]+)\]\((\/library\/[a-z0-9-]+|https:\/\/[^\s)]+)\)/g;

export function splitInlineLinks(source: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE_LINK)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ type: "text", text: source.slice(last, index) });
    }
    const label = match[1];
    const href = match[2];
    if (label && href) parts.push({ type: "link", label, href });
    last = index + match[0].length;
  }
  if (last < source.length) parts.push({ type: "text", text: source.slice(last) });
  return parts.length > 0 ? parts : [{ type: "text", text: source }];
}
