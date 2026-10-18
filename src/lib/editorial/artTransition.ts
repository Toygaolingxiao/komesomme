export type ArtTransitionKind = "brand" | "collection" | "pair";

/** Shared `view-transition-name` for an editorial still that travels between routes. */
export function artViewTransitionName(kind: ArtTransitionKind, id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `km-art-${kind}-${safe || "x"}`;
}
