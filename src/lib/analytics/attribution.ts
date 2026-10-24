/** First-touch landing attribution for our own access log. GA4 still reads the URL. */

export const ATTRIBUTION_STORAGE_KEY = "km_attr";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type LandingAttribution = Partial<Record<UtmKey, string>> & {
  referrer?: string;
};

const MAX_LEN = 120;

type AttrStorage = Pick<Storage, "getItem" | "setItem">;

export function cleanAttributionToken(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_LEN);
  return cleaned || undefined;
}

/** Host + path only. Query strings on the referrer are dropped. */
export function externalReferrer(
  referrer: string | null | undefined,
  pageOrigin?: string | null
): string | undefined {
  const raw = referrer?.trim();
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (pageOrigin) {
    try {
      if (url.origin === new URL(pageOrigin).origin) return undefined;
    } catch {
      /* keep the external host */
    }
  }
  return cleanAttributionToken(`${url.origin}${url.pathname}`);
}

export function parseLandingAttribution(input: {
  search: string;
  referrer?: string | null;
  pageOrigin?: string | null;
}): LandingAttribution {
  const rawSearch = input.search.startsWith("?") ? input.search.slice(1) : input.search;
  const params = new URLSearchParams(rawSearch);
  const out: LandingAttribution = {};
  for (const key of UTM_KEYS) {
    const value = cleanAttributionToken(params.get(key));
    if (value) out[key] = value;
  }
  const referrer = externalReferrer(input.referrer, input.pageOrigin);
  if (referrer) out.referrer = referrer;
  return out;
}

function normalizeStored(value: object): LandingAttribution {
  const record = value as Record<string, unknown>;
  const out: LandingAttribution = {};
  for (const key of UTM_KEYS) {
    if (typeof record[key] === "string") {
      const cleaned = cleanAttributionToken(record[key]);
      if (cleaned) out[key] = cleaned;
    }
  }
  if (typeof record.referrer === "string") {
    const cleaned = cleanAttributionToken(record.referrer);
    if (cleaned) out.referrer = cleaned;
  }
  return out;
}

/**
 * First call in the tab wins, including a direct visit with no UTM.
 * Later in-app navigations must not replace that landing.
 */
export function captureFirstTouch(
  storage: AttrStorage,
  input: { search: string; referrer?: string | null; pageOrigin?: string | null }
): LandingAttribution {
  try {
    const existing = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return normalizeStored(parsed);
      }
    }
  } catch {
    /* rewrite below */
  }
  const fresh = parseLandingAttribution(input);
  try {
    storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* private mode */
  }
  return fresh;
}

export function readLandingAttribution(): LandingAttribution {
  if (typeof window === "undefined") return {};
  try {
    return captureFirstTouch(window.sessionStorage, {
      search: window.location.search,
      referrer: document.referrer,
      pageOrigin: window.location.origin,
    });
  } catch {
    return {};
  }
}
