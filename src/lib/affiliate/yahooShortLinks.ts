/** Official LINE Yahoo Shopping Affiliate short URL (`yahoo.jp/xxxx`). */

export function parseYahooShoppingShortLink(value: string): string | undefined {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return undefined;
  const withScheme = (/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).replace(
    /^http:\/\//i,
    "https://",
  );
  // Official short codes use alphanumerics, hyphens, and underscores (t5-DJZ, Z4_Crm).
  const match = withScheme.match(/^https:\/\/yahoo\.jp\/([A-Za-z0-9_-]+)$/i);
  return match ? `https://yahoo.jp/${match[1]}` : undefined;
}

/** True when the href is an official LINE Yahoo short link (not a search result). */
export function isYahooPromoShortHref(value: string): boolean {
  return Boolean(parseYahooShoppingShortLink(value));
}

/** Shop CTA: filled promo short link wins over search / ItemSearch. */
export function resolveYahooShopHref(
  promoUrl: string | undefined,
  fallback: string,
): string {
  return promoUrl ?? fallback;
}

export type YahooAffiliateSheetRow = {
  brandId: string;
  name: string;
  prefecture: string;
  region: string;
  searchKeyword: string;
  promoUrl: string | null;
  noProducts: boolean;
  recordedAt: string | null;
};

export type YahooAffiliateDbRow = {
  brand_id: string;
  name?: string | null;
  prefecture?: string | null;
  region?: string | null;
  search_keyword?: string | null;
  promo_url: string | null;
  no_products?: boolean | null;
  recorded_at: string | null;
};

/** Catalogue drives the sheet. DB supplies promo_url / no_products / recorded_at. */
export function mergeYahooAffiliateSheet(
  catalog: Array<{
    id: string;
    name: string;
    prefecture: string;
    region: string;
    searchKeyword?: string;
  }>,
  dbRows: YahooAffiliateDbRow[],
): YahooAffiliateSheetRow[] {
  const byId = new Map(dbRows.map((row) => [row.brand_id, row]));
  const seen = new Set<string>();
  const rows: YahooAffiliateSheetRow[] = catalog.map((rice) => {
    seen.add(rice.id);
    const stored = byId.get(rice.id);
    const promoUrl = stored?.promo_url ? parseYahooShoppingShortLink(stored.promo_url) ?? null : null;
    const searchKeyword = rice.searchKeyword?.trim() || rice.name.trim();
    return {
      brandId: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      searchKeyword,
      promoUrl,
      noProducts: Boolean(stored?.no_products) && !promoUrl,
      recordedAt: promoUrl ? stored?.recorded_at ?? null : null,
    };
  });

  const leftovers = dbRows.filter(
    (row) => (row.promo_url || row.no_products) && !seen.has(row.brand_id),
  );
  leftovers.sort((a, b) => a.brand_id.localeCompare(b.brand_id));
  for (const stored of leftovers) {
    const promoUrl = parseYahooShoppingShortLink(stored.promo_url ?? "") ?? null;
    const name = stored.name?.trim() || stored.brand_id;
    rows.push({
      brandId: stored.brand_id,
      name,
      prefecture: stored.prefecture?.trim() || "",
      region: stored.region?.trim() || "",
      searchKeyword: stored.search_keyword?.trim() || name,
      promoUrl,
      noProducts: Boolean(stored.no_products) && !promoUrl,
      recordedAt: promoUrl ? stored.recorded_at : null,
    });
  }

  return rows;
}
