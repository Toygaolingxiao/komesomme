import { createAdminClient } from "@/lib/supabase/admin";
import {
  mergeYahooAffiliateSheet,
  parseYahooShoppingShortLink,
  type YahooAffiliateDbRow,
  type YahooAffiliateSheetRow,
} from "@/lib/affiliate/yahooShortLinks";
import { yahooFurusatoSheetKeyword } from "@/lib/affiliate";
import { riceProfiles } from "@/data/rice/catalog";
import type { RiceProfileV2 } from "@/types/rice";
import type { YahooShoppingAffiliateLinkRow } from "@/types/database";

const CACHE_MS = 45_000;

export type YahooPromoChannel = "shopping" | "furusato";

type PromoCache = {
  expires: number;
  byBrand: Map<string, string>;
};

const caches: Record<YahooPromoChannel, PromoCache | null> = {
  shopping: null,
  furusato: null,
};

const TABLE: Record<YahooPromoChannel, "yahoo_shopping_affiliate_links" | "yahoo_furusato_affiliate_links"> =
  {
    shopping: "yahoo_shopping_affiliate_links",
    furusato: "yahoo_furusato_affiliate_links",
  };

type SavedPromo = Pick<YahooShoppingAffiliateLinkRow, "promo_url" | "recorded_at" | "no_products">;

function yahooLinks(channel: YahooPromoChannel) {
  return createAdminClient().from(TABLE[channel]);
}

export function invalidateYahooPromoCache() {
  caches.shopping = null;
}

export function invalidateYahooFurusatoPromoCache() {
  caches.furusato = null;
}

function invalidateChannel(channel: YahooPromoChannel) {
  caches[channel] = null;
}

/** True only when the table itself is missing — not when a column is missing. */
function isMissingTable(message: string, channel: YahooPromoChannel): boolean {
  const table = TABLE[channel];
  if (new RegExp(`column\\s+.*${table}`, "i").test(message)) return false;
  return (
    new RegExp(`could not find the table [^]*${table}`, "i").test(message) ||
    new RegExp(`relation ["']?public\\.${table}["']? does not exist`, "i").test(message) ||
    new RegExp(`relation ["']?${table}["']? does not exist`, "i").test(message)
  );
}

function searchKeywordFor(rice: RiceProfileV2, channel: YahooPromoChannel): string {
  if (channel === "furusato") {
    return yahooFurusatoSheetKeyword({
      prefecture: rice.prefecture,
      brand: rice.name,
      furusatoKeywords: rice.furusato_keywords,
    });
  }
  return rice.name.trim();
}

function toSheetRow(
  rice: RiceProfileV2,
  saved: SavedPromo | null,
  channel: YahooPromoChannel,
): YahooAffiliateSheetRow {
  const promoUrl = saved?.promo_url ? parseYahooShoppingShortLink(saved.promo_url) ?? null : null;
  return {
    brandId: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    searchKeyword: searchKeywordFor(rice, channel),
    promoUrl,
    noProducts: Boolean(saved?.no_products) && !promoUrl,
    recordedAt: promoUrl ? saved?.recorded_at ?? null : null,
  };
}

function sortedCatalog(channel: YahooPromoChannel) {
  return riceProfiles
    .map((rice) => ({
      id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      searchKeyword: searchKeywordFor(rice, channel),
    }))
    .sort(
      (a, b) => a.region.localeCompare(b.region, "ja") || a.name.localeCompare(b.name, "ja"),
    );
}

async function lookupPromoUrl(
  channel: YahooPromoChannel,
  brandId: string,
): Promise<string | undefined> {
  const map = await loadPromoMap(channel);
  const cached = map.get(brandId);
  if (cached) return cached;

  // Map cache can miss a row filled seconds ago. One-row read so the shop CTA
  // prefers the new short link without waiting for CACHE_MS.
  try {
    const { data, error } = await yahooLinks(channel)
      .select("promo_url")
      .eq("brand_id", brandId)
      .maybeSingle();
    if (error) {
      if (!isMissingTable(error.message, channel)) {
        console.error(`yahoo ${channel} promo lookup:`, error.message);
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
    console.error(`yahoo ${channel} promo lookup:`, cause);
  }
  return undefined;
}

async function loadPromoMap(channel: YahooPromoChannel): Promise<Map<string, string>> {
  const hit = caches[channel];
  if (hit && hit.expires > Date.now()) return hit.byBrand;

  const byBrand = new Map<string, string>();
  try {
    const { data, error } = await yahooLinks(channel)
      .select("brand_id, promo_url")
      .not("promo_url", "is", null);

    if (error) {
      if (!isMissingTable(error.message, channel)) {
        console.error(`yahoo ${channel} promo lookup:`, error.message);
      }
    } else {
      const rows = (data ?? []) as Array<Pick<YahooShoppingAffiliateLinkRow, "brand_id" | "promo_url">>;
      for (const row of rows) {
        const url = parseYahooShoppingShortLink(row.promo_url ?? "");
        if (url) byBrand.set(row.brand_id, url);
      }
    }
  } catch (cause) {
    console.error(`yahoo ${channel} promo lookup:`, cause);
  }

  caches[channel] = { expires: Date.now() + CACHE_MS, byBrand };
  return byBrand;
}

async function probeTable(channel: YahooPromoChannel): Promise<boolean> {
  try {
    const { error } = await yahooLinks(channel).select("brand_id").limit(1);
    if (error) return !isMissingTable(error.message, channel);
    return true;
  } catch {
    return false;
  }
}

async function fetchAffiliateRows(channel: YahooPromoChannel): Promise<YahooAffiliateDbRow[]> {
  const attempts =
    channel === "shopping"
      ? [
          "brand_id, name, prefecture, region, search_keyword, promo_url, no_products, recorded_at",
          "brand_id, name, prefecture, region, promo_url, no_products, recorded_at",
          "brand_id, name, prefecture, region, promo_url, recorded_at",
        ]
      : ["brand_id, name, prefecture, region, search_keyword, promo_url, no_products, recorded_at"];
  try {
    let lastMessage = "";
    for (const columns of attempts) {
      const { data, error } = await yahooLinks(channel).select(columns);
      if (!error) return (data ?? []) as YahooAffiliateDbRow[];
      lastMessage = error.message;
      if (isMissingTable(error.message, channel)) return [];
    }
    throw new Error(lastMessage || `yahoo ${channel} affiliate select failed`);
  } catch (cause) {
    if (cause instanceof Error && isMissingTable(cause.message, channel)) return [];
    throw cause;
  }
}

async function loadAffiliateSheet(channel: YahooPromoChannel): Promise<{
  rows: YahooAffiliateSheetRow[];
  tableReady: boolean;
}> {
  const tableReady = await probeTable(channel);
  const dbRows = tableReady ? await fetchAffiliateRows(channel) : [];
  return { rows: mergeYahooAffiliateSheet(sortedCatalog(channel), dbRows), tableReady };
}

export type YahooAffiliateSavePatch = {
  promoUrl?: string;
  noProducts?: boolean;
};

async function saveAffiliateRow(
  channel: YahooPromoChannel,
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

  const existing = await yahooLinks(channel)
    .select("promo_url, no_products, recorded_at")
    .eq("brand_id", brandId)
    .maybeSingle();
  const current = (existing.data ?? null) as SavedPromo | null;

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
    search_keyword: searchKeywordFor(rice, channel),
    promo_url: nextNoProducts ? null : nextPromo,
    no_products: nextNoProducts,
  };

  // defaultToNull must stay false — otherwise omitted columns (e.g. sync) wipe promo_url.
  const upsertOpts = { onConflict: "brand_id", defaultToNull: false } as const;
  const links = yahooLinks(channel);

  let { data, error } = await links
    .upsert(payload as never, upsertOpts)
    .select("promo_url, recorded_at, no_products")
    .single();

  if (channel === "shopping" && error && /no_products/i.test(error.message)) {
    if (patch.noProducts !== undefined) {
      throw new Error("column missing");
    }
    const withoutFlag = { ...payload };
    delete withoutFlag.no_products;
    ({ data, error } = await links
      .upsert(withoutFlag as never, upsertOpts)
      .select("promo_url, recorded_at")
      .single());
  }

  if (channel === "shopping" && error && /search_keyword/i.test(error.message)) {
    const slim = {
      brand_id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      promo_url: nextNoProducts ? null : nextPromo,
      no_products: nextNoProducts,
    };
    ({ data, error } = await links
      .upsert(slim as never, upsertOpts)
      .select("promo_url, recorded_at, no_products")
      .single());
  }

  if (error) {
    throw new Error(isMissingTable(error.message, channel) ? "table missing" : error.message);
  }

  invalidateChannel(channel);
  return toSheetRow(rice, data as SavedPromo | null, channel);
}

async function syncAffiliateBrandRows(channel: YahooPromoChannel): Promise<{
  upserted: number;
  filled: number;
  noProducts: number;
}> {
  const rows = riceProfiles.map((rice) => ({
    brand_id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    search_keyword: searchKeywordFor(rice, channel),
  }));

  const supabaseLinks = yahooLinks(channel);
  const chunk = 80;
  let payload: unknown[] = rows;
  for (let i = 0; i < payload.length; i += chunk) {
    const { error } = await supabaseLinks.upsert(payload.slice(i, i + chunk) as never, {
      onConflict: "brand_id",
      defaultToNull: false,
    });
    if (error) {
      const missingKeyword = channel === "shopping" && /search_keyword/i.test(error.message);
      if (missingKeyword && payload === rows) {
        payload = rows.map(({ search_keyword: _ignored, ...rest }) => rest);
        i = -chunk;
        continue;
      }
      throw new Error(isMissingTable(error.message, channel) ? "table missing" : error.message);
    }
  }

  const filled = await yahooLinks(channel)
    .select("brand_id", { count: "exact", head: true })
    .not("promo_url", "is", null);
  if (filled.error) throw new Error(filled.error.message);

  let noProductsCount = 0;
  const noProducts = await yahooLinks(channel)
    .select("brand_id", { count: "exact", head: true })
    .eq("no_products", true);
  if (!noProducts.error) noProductsCount = noProducts.count ?? 0;

  invalidateChannel(channel);
  return {
    upserted: rows.length,
    filled: filled.count ?? 0,
    noProducts: noProductsCount,
  };
}

export async function lookupYahooPromoUrl(brandId: string): Promise<string | undefined> {
  return lookupPromoUrl("shopping", brandId);
}

export async function lookupYahooFurusatoPromoUrl(brandId: string): Promise<string | undefined> {
  return lookupPromoUrl("furusato", brandId);
}

export async function loadYahooPromoMap(): Promise<Map<string, string>> {
  return loadPromoMap("shopping");
}

export async function probeYahooAffiliateTable(): Promise<boolean> {
  return probeTable("shopping");
}

export async function loadYahooAffiliateSheet(): Promise<{
  rows: YahooAffiliateSheetRow[];
  tableReady: boolean;
}> {
  return loadAffiliateSheet("shopping");
}

export async function loadYahooFurusatoAffiliateSheet(): Promise<{
  rows: YahooAffiliateSheetRow[];
  tableReady: boolean;
}> {
  return loadAffiliateSheet("furusato");
}

export async function saveYahooAffiliateRow(
  brandId: string,
  patch: YahooAffiliateSavePatch,
): Promise<YahooAffiliateSheetRow> {
  return saveAffiliateRow("shopping", brandId, patch);
}

export async function saveYahooFurusatoAffiliateRow(
  brandId: string,
  patch: YahooAffiliateSavePatch,
): Promise<YahooAffiliateSheetRow> {
  return saveAffiliateRow("furusato", brandId, patch);
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
  return syncAffiliateBrandRows("shopping");
}

export async function syncYahooFurusatoAffiliateBrandRows(): Promise<{
  upserted: number;
  filled: number;
  noProducts: number;
}> {
  return syncAffiliateBrandRows("furusato");
}
