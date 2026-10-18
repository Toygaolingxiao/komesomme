/** Join phrases without putting a comma after a sentence end. */
export function joinClauses(parts: readonly string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      if (!acc) return part;
      const sep = /[。！？!?]$/.test(acc) ? "" : "、";
      return `${acc}${sep}${part}`;
    }, "");
}
