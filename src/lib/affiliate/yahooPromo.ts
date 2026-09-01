import { createAdminClient } from "@/lib/supabase/admin";
import {
  mergeYahooAffiliateSheet,
  parseYahooShoppingShortLink,
  type YahooAffiliateDbRow,
  type YahooAffiliateSheetRow,
} from "@/lib/affiliate/yahooShortLinks";
import { riceProfiles } from "@/data/rice/catalog";
import type { YahooShoppingAffiliateLinkRow } from "@/types/database";

const CACHE_MS = 45_000;

type PromoCache = {
  expires: number;
  byBrand: Map<string, string>;
};

let cache: PromoCache | null = null;

function yahooLinks() {
  return createAdminClient().from("yahoo_shopping_affiliate_links");
}

export function invalidateYahooPromoCache() {
  cache = null;
}

/** True only when the table itself is missing — not when a column is missing. */
function isMissingTable(message: string): boolean {
  if (/column\s+.*yahoo_shopping_affiliate_links/i.test(message)) return false;
  return (
    /could not find the table [^]*yahoo_shopping_affiliate_links/i.test(message) ||
    /relation ["']?public\.yahoo_shopping_affiliate_links["']? does not exist/i.test(message) ||
    /relation ["']?yahoo_shopping_affiliate_links["']? does not exist/i.test(message)
  );
}

function toSheetRow(
  rice: { id: string; name: string; prefecture: string; region: string },
  saved: Pick<YahooShoppingAffiliateLinkRow, "promo_url" | "recorded_at" | "no_products"> | null,
): YahooAffiliateSheetRow {
  const promoUrl = saved?.promo_url ? parseYahooShoppingShortLink(saved.promo_url) ?? null : null;
  return {
    brandId: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    searchKeyword: rice.name.trim(),
    promoUrl,
    noProducts: Boolean(saved?.no_products) && !promoUrl,
    recordedAt: promoUrl ? saved?.recorded_at ?? null : null,
  };
}

export async function lookupYahooPromoUrl(brandId: string): Promise<string | undefined> {
  const map = await loadYahooPromoMap();
  const cached = map.get(brandId);
  if (cached) return cached;

  // Map cache can miss a row filled seconds ago. One-row read so the shop CTA
  // prefers the new short link without waiting for CACHE_MS.
  try {
    const { data, error } = await yahooLinks()
      .select("promo_url")
      .eq("brand_id", brandId)
      .maybeSingle();
    if (error) {
      if (!isMissingTable(error.message)) {
        console.error("yahoo promo lookup:", error.message);
      }
      return undefined;
    }
    const url = parseYahooShoppingShortLink(
      ((data as { promo_url?: string | null } | null)?.promo_url ?? ""),
    );
    if (url) {
      map.set(brandId, url);
      return url;
    }
  } catch (cause) {
    console.error("yahoo promo lookup:", cause);
  }
  return undefined;
}

export async function loadYahooPromoMap(): Promise<Map<string, string>> {
  if (cache && cache.expires > Date.now()) return cache.byBrand;

  const byBrand = new Map<string, string>();
  try {
    const { data, error } = await yahooLinks()
      .select("brand_id, promo_url")
      .not("promo_url", "is", null);

    if (error) {
      if (!isMissingTable(error.message)) {
        console.error("yahoo promo lookup:", error.message);
      }
    } else {
      const rows = (data ?? []) as Array<Pick<YahooShoppingAffiliateLinkRow, "brand_id" | "promo_url">>;
      for (const row of rows) {
        const url = parseYahooShoppingShortLink(row.promo_url ?? "");
        if (url) byBrand.set(row.brand_id, url);
      }
    }
  } catch (cause) {
    console.error("yahoo promo lookup:", cause);
  }

  cache = { expires: Date.now() + CACHE_MS, byBrand };
  return byBrand;
}

export async function probeYahooAffiliateTable(): Promise<boolean> {
  try {
    const { error } = await yahooLinks().select("brand_id").limit(1);
    if (error) return !isMissingTable(error.message);
    return true;
  } catch {
    return false;
  }
}

export async function loadYahooAffiliateSheet(): Promise<{
  rows: YahooAffiliateSheetRow[];
  tableReady: boolean;
}> {
  const tableReady = await probeYahooAffiliateTable();
  const dbRows = tableReady ? await fetchYahooAffiliateRows() : [];
  const catalog = riceProfiles
    .map((rice) => ({
      id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
    }))
    .sort(
      (a, b) => a.region.localeCompare(b.region, "ja") || a.name.localeCompare(b.name, "ja"),
    );
  return { rows: mergeYahooAffiliateSheet(catalog, dbRows), tableReady };
}

async function fetchYahooAffiliateRows(): Promise<YahooAffiliateDbRow[]> {
  const attempts = [
    "brand_id, name, prefecture, region, search_keyword, promo_url, no_products, recorded_at",
    "brand_id, name, prefecture, region, promo_url, no_products, recorded_at",
    "brand_id, name, prefecture, region, promo_url, recorded_at",
  ];
  try {
    let lastMessage = "";
    for (const columns of attempts) {
      const { data, error } = await yahooLinks().select(columns);
      if (!error) return (data ?? []) as YahooAffiliateDbRow[];
      lastMessage = error.message;
      if (isMissingTable(error.message)) return [];
    }
    throw new Error(lastMessage || "yahoo affiliate select failed");
  } catch (cause) {
    if (cause instanceof Error && isMissingTable(cause.message)) return [];
    throw cause;
  }
}

export type YahooAffiliateSavePatch = {
  promoUrl?: string;
  noProducts?: boolean;
};

export async function saveYahooAffiliateRow(
  brandId: string,
  patch: YahooAffiliateSavePatch,
): Promise<YahooAffiliateSheetRow> {
  const rice = riceProfiles.find((item) => item.id === brandId);
  if (!rice) {
    throw new Error("unknown brand");
  }

  let promoUrl: string | null | undefined;
  if (patch.promoUrl !== undefined) {
    const trimmed = patch.promoUrl.trim();
    promoUrl = trimmed ? parseYahooShoppingShortLink(trimmed) : null;
    if (trimmed && !promoUrl) {
      throw new Error("invalid promo url");
    }
  }

  const existing = await yahooLinks()
    .select("promo_url, no_products, recorded_at")
    .eq("brand_id", brandId)
    .maybeSingle();
  const current = (existing.data ?? null) as Pick<
    YahooShoppingAffiliateLinkRow,
    "promo_url" | "no_products" | "recorded_at"
  > | null;

  const nextPromo =
    promoUrl !== undefined
      ? promoUrl
      : current?.promo_url
        ? parseYahooShoppingShortLink(current.promo_url) ?? null
        : null;

  let nextNoProducts =
    patch.noProducts !== undefined ? patch.noProducts : Boolean(current?.no_products);

  // A real short link wins over the "no products" flag.
  if (nextPromo) nextNoProducts = false;
  // Marking no-products clears any leftover short link.
  if (nextNoProducts) promoUrl = null;

  const payload: Record<string, unknown> = {
    brand_id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    search_keyword: rice.name.trim(),
    promo_url: nextNoProducts ? null : nextPromo,
    no_products: nextNoProducts,
  };

  // defaultToNull must stay false — otherwise omitted columns (e.g. sync) wipe promo_url.
  const upsertOpts = { onConflict: "brand_id", defaultToNull: false } as const;

  let { data, error } = await yahooLinks()
    .upsert(payload as never, upsertOpts)
    .select("promo_url, recorded_at, no_products")
    .single();

  if (error && /no_products/i.test(error.message)) {
    if (patch.noProducts !== undefined) {
      throw new Error("column missing");
    }
    const withoutFlag = { ...payload };
    delete withoutFlag.no_products;
    ({ data, error } = await yahooLinks()
      .upsert(withoutFlag as never, upsertOpts)
      .select("promo_url, recorded_at")
      .single());
  }

  if (error && /search_keyword/i.test(error.message)) {
    const slim = {
      brand_id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      promo_url: nextNoProducts ? null : nextPromo,
      no_products: nextNoProducts,
    };
    ({ data, error } = await yahooLinks()
      .upsert(slim as never, upsertOpts)
      .select("promo_url, recorded_at, no_products")
      .single());
  }

  if (error) {
    throw new Error(isMissingTable(error.message) ? "table missing" : error.message);
  }

  invalidateYahooPromoCache();
  return toSheetRow(
    rice,
    data as Pick<YahooShoppingAffiliateLinkRow, "promo_url" | "recorded_at" | "no_products"> | null,
  );
}

/** @deprecated Prefer saveYahooAffiliateRow. */
export async function saveYahooPromoUrl(
  brandId: string,
  rawUrl: string,
): Promise<YahooAffiliateSheetRow> {
  return saveYahooAffiliateRow(brandId, { promoUrl: rawUrl });
}

export async function syncYahooAffiliateBrandRows(): Promise<{
  upserted: number;
  filled: number;
  noProducts: number;
}> {
  const rows = riceProfiles.map((rice) => ({
    brand_id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    search_keyword: rice.name.trim(),
  }));

  const supabaseLinks = yahooLinks();
  const chunk = 80;
  let payload: unknown[] = rows;
  for (let i = 0; i < payload.length; i += chunk) {
    const { error } = await supabaseLinks.upsert(payload.slice(i, i + chunk) as never, {
      onConflict: "brand_id",
      defaultToNull: false,
    });
    if (error) {
      const missingKeyword = /search_keyword/i.test(error.message);
      if (missingKeyword && payload === rows) {
        payload = rows.map(({ search_keyword: _ignored, ...rest }) => rest);
        i = -chunk;
        continue;
      }
      throw new Error(isMissingTable(error.message) ? "table missing" : error.message);
    }
  }

  const filled = await yahooLinks()
    .select("brand_id", { count: "exact", head: true })
    .not("promo_url", "is", null);
  if (filled.error) throw new Error(filled.error.message);

  let noProductsCount = 0;
  const noProducts = await yahooLinks()
    .select("brand_id", { count: "exact", head: true })
    .eq("no_products", true);
  if (!noProducts.error) noProductsCount = noProducts.count ?? 0;

  invalidateYahooPromoCache();
  return {
    upserted: rows.length,
    filled: filled.count ?? 0,
    noProducts: noProductsCount,
  };
}
