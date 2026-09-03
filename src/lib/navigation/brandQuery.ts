/** Home shallow route: `/?brand=<riceId>` opens the tasting panel. */
export const BRAND_QUERY = "brand";

export function readBrandQuery(
  search = typeof window !== "undefined" ? window.location.search : ""
): string | null {
  const raw = new URLSearchParams(search).get(BRAND_QUERY)?.trim();
  return raw || null;
}

/** Sync the brand query without a Next navigation (keeps the map mounted). */
export function writeBrandQuery(
  id: string | null,
  mode: "replace" | "push" = "replace"
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(BRAND_QUERY, id);
  else url.searchParams.delete(BRAND_QUERY);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const state = { brand: id };
  if (mode === "push") window.history.pushState(state, "", next);
  else window.history.replaceState(state, "", next);
}
