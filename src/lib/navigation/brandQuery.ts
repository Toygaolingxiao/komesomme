/** Home shallow route: `/?brand=<riceId>` opens the tasting panel. */
export const BRAND_QUERY = "brand";

export function readBrandQuery(
  search = typeof window !== "undefined" ? window.location.search : ""
): string | null {
  const raw = new URLSearchParams(search).get(BRAND_QUERY)?.trim();
  return raw || null;
}

function currentPath(href = typeof window !== "undefined" ? window.location.href : ""): string {
  const url = new URL(href);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Sync the brand query without a Next navigation (keeps the map mounted).
 * No-ops when the URL is already the target — slider input fires dozens of
 * times per drag. Chrome and WebKit throw (or Next's history patch blows up)
 * after about 100 history mutations in a few seconds.
 */
export function writeBrandQuery(
  id: string | null,
  mode: "replace" | "push" = "replace"
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(BRAND_QUERY, id);
  else url.searchParams.delete(BRAND_QUERY);
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next === currentPath()) return;
  const state = { brand: id };
  try {
    if (mode === "push") window.history.pushState(state, "", next);
    else window.history.replaceState(state, "", next);
  } catch {
    // Chrome / WebKit / Next history patch: a failed mutation must not crash the map.
  }
}
