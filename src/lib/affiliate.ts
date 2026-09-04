/**
 * Client-safe affiliate URL builders.
 * Yahoo Item Search and Rakuten Item Search stay in server modules.
 */

export const AFFILIATE_LINK_REL = "noopener noreferrer nofollow" as const;

/** Amazon Associates Operating Agreement art. 5 (required, prominent). Footer only. */
export const AMAZON_ASSOCIATE_DISCLOSURE =
  "Amazonのアソシエイトとして、KomeSommeは適格販売により収入を得ています。";

/** Near-CTA chip. Footer carries the full 「アフィリエイト広告」sentence. */
export const AFFILIATE_PR_LABEL = "※PR";

/**
 * Footer / `AffiliateDisclosure` `full`. 景表法.
 * ASP names stay in `AFFILIATE_PR_NOTICE_DETAIL` (terms), not in chrome.
 */
export const AFFILIATE_PR_NOTICE =
  "外部リンクにはアフィリエイト広告を含みます。";

/** `/terms` only — names the ASPs. Do not paste into CTA chrome. */
export const AFFILIATE_PR_NOTICE_DETAIL =
  "当サイトの外部リンクにはアフィリエイト広告が含まれる場合があります（Amazonアソシエイト、楽天アフィリエイト、Yahoo!ショッピング公式アフィリエイト、メルカリアンバサダー等）。";

/** Footer one-liner. */
export const TASTE_DISCLAIMER =
  "味わい評価はKomeSomme独自基準による目安です。";

/** Brand overlay / library dossier. */
export const TASTE_DISCLAIMER_DETAIL =
  "味わい評価はKomeSomme独自基準による目安です。公的な認定・等級を示すものではありません。";

/**
 * @deprecated ValueCommerce は採用しない（2026-09）。転鎖ヘルパは互換のため残すが常に無効。
 * 本番の Yahoo は公式短鎖（通販・ふるさと別表）またはプレーン検索。
 */
export const VALUE_COMMERCE_REFERRAL_HTTPS =
  "https://ck.jp.ap.valuecommerce.com/servlet/referral";

/** @deprecated See VALUE_COMMERCE_REFERRAL_HTTPS. */
export const VALUE_COMMERCE_REFERRAL_HTTP =
  "http://ck.jp.ap.valuecommerce.com/servlet/referral";

const SATOFULL_DEFAULT_BASE = "https://www.satofull.jp/products/list.php?q=";

export type AffiliateBrandInput = {
  prefecture: string;
  brand: string;
};

export function shopQuery({ prefecture, brand }: AffiliateBrandInput): string {
  return [prefecture.trim(), brand.trim(), "白米"].filter(Boolean).join(" ");
}

export function furusatoQuery({ prefecture, brand }: AffiliateBrandInput): string {
  return [prefecture.trim(), brand.trim()].filter(Boolean).join(" ");
}

/**
 * Keyword shown on the Yahoo ふるさと ops sheet and pasted into Yahoo search.
 * Always includes ふるさと納税 so the affiliate tool hits 返礼品, not 通販米.
 */
export function yahooFurusatoSheetKeyword(
  input: AffiliateBrandInput & { furusatoKeywords?: readonly string[] | null },
): string {
  const fromCatalog = input.furusatoKeywords?.[0]?.trim();
  return qualifyFurusatoQuery(fromCatalog || furusatoQuery(input));
}

/** Search UIs expect ふるさと納税 in the query; overlay keywords often already include it. */
export function qualifyFurusatoQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "ふるさと納税 米";
  if (/ふるさと納税|返礼品/.test(trimmed)) return trimmed;
  return `${trimmed} ふるさと納税`;
}

export function amazonAssociateTag(): string {
  return (
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim() ||
    process.env.AMAZON_ASSOCIATE_TAG?.trim() ||
    ""
  );
}

export function amazonSearchUrl(query: string): string {
  const params = new URLSearchParams({ k: query });
  const tag = amazonAssociateTag();
  if (tag) params.set("tag", tag);
  return `https://www.amazon.co.jp/s?${params.toString()}`;
}

/** メルカリアンバサダー ID（公開クエリ `afid`）。env 優先、未設定時は登録済み ID。 */
export function mercariAffiliateId(): string {
  return (
    process.env.NEXT_PUBLIC_MERCARI_AFID?.trim() ||
    process.env.MERCARI_AFID?.trim() ||
    "7137822833"
  );
}

/**
 * 検索結果ページ向けアフィ URL。
 * 公式: 検索結果もアンバサダー対象（リンクのみ）。afid は管理画面／ツールバー発行の ID。
 */
export function mercariSearchUrl(query: string): string {
  const url = new URL("https://jp.mercari.com/search");
  url.searchParams.set("keyword", query);
  const afid = mercariAffiliateId();
  if (afid) url.searchParams.set("afid", afid);
  return url.toString();
}

export function yahooShoppingSearchUrl(query: string): string {
  return `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(query)}`;
}

export function yahooFurusatoSearchUrl(query: string): string {
  return `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(qualifyFurusatoQuery(query))}`;
}

export function rakutenFurusatoSearchUrl(query: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(qualifyFurusatoQuery(query))}/`;
}

export function satofullSearchBase(): string {
  return process.env.SATOFULL_SEARCH_BASE_URL?.trim() || SATOFULL_DEFAULT_BASE;
}

export function satofullSearchUrl(query: string, base = satofullSearchBase()): string {
  const prefix = base.trim() || SATOFULL_DEFAULT_BASE;
  if (/[?&]q=$/.test(prefix) || prefix.endsWith("q=")) {
    return `${prefix}${encodeURIComponent(query)}`;
  }
  const joiner = prefix.includes("?") ? "&" : "?";
  return `${prefix}${joiner}q=${encodeURIComponent(query)}`;
}

export function valueCommerceReferralUrl(targetUrl: string, sid: string, pid: string): string {
  const params = new URLSearchParams({ sid, pid, vc_url: targetUrl });
  return `${VALUE_COMMERCE_REFERRAL_HTTPS}?${params.toString()}`;
}

/** Yahoo API `affiliate_id` (VC). URLSearchParams will encode this value. */
export function yahooValueCommerceAffiliateId(sid: string, pid: string): string {
  return `${VALUE_COMMERCE_REFERRAL_HTTP}?sid=${sid}&pid=${pid}&vc_url=`;
}

export function yahooValueCommerceEnv(): { sid: string; pid: string } {
  return {
    sid:
      process.env.YAHOO_VC_SID?.trim() ||
      process.env.NEXT_PUBLIC_YAHOO_VC_SID?.trim() ||
      "",
    pid:
      process.env.YAHOO_VC_PID?.trim() ||
      process.env.NEXT_PUBLIC_YAHOO_VC_PID?.trim() ||
      "",
  };
}

export function satofullValueCommerceEnv(): { sid: string; pid: string } {
  return {
    sid:
      process.env.SATOFULL_VC_SID?.trim() ||
      process.env.NEXT_PUBLIC_SATOFULL_VC_SID?.trim() ||
      "",
    pid:
      process.env.SATOFULL_VC_PID?.trim() ||
      process.env.NEXT_PUBLIC_SATOFULL_VC_PID?.trim() ||
      "",
  };
}

/** ValueCommerce 廃止。常に false（環境変数では再有効化しない）。 */
export function valueCommerceWrapEnabled(): boolean {
  return false;
}

/** VC 廃止後は常に素の URL を返す。 */
export function wrapValueCommerceIfReady(
  targetUrl: string,
  _sid?: string,
  _pid?: string
): string {
  return targetUrl;
}

export function wrapYahooSearchUrl(query: string, sid?: string, pid?: string): string {
  const { sid: envSid, pid: envPid } = yahooValueCommerceEnv();
  return wrapValueCommerceIfReady(yahooShoppingSearchUrl(query), sid ?? envSid, pid ?? envPid);
}

export function wrapYahooFurusatoSearchUrl(query: string, sid?: string, pid?: string): string {
  const { sid: envSid, pid: envPid } = yahooValueCommerceEnv();
  return wrapValueCommerceIfReady(yahooFurusatoSearchUrl(query), sid ?? envSid, pid ?? envPid);
}

export function wrapSatofullSearchUrl(query: string, sid?: string, pid?: string): string {
  const { sid: envSid, pid: envPid } = satofullValueCommerceEnv();
  return wrapValueCommerceIfReady(satofullSearchUrl(query), sid ?? envSid, pid ?? envPid);
}

export function clientAffiliateHrefs(input: AffiliateBrandInput): {
  amazon: string;
  yahoo: string;
  mercari: string;
  satofull: string;
  yahooFurusato: string;
  rakutenFurusato: string;
} {
  const shop = shopQuery(input);
  const furusato = furusatoQuery(input);
  return {
    amazon: amazonSearchUrl(shop),
    yahoo: yahooShoppingSearchUrl(shop),
    mercari: mercariSearchUrl(shop),
    satofull: satofullSearchUrl(furusato),
    yahooFurusato: yahooFurusatoSearchUrl(furusato),
    rakutenFurusato: rakutenFurusatoSearchUrl(furusato),
  };
}
