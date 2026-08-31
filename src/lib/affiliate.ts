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
 * Footer / `AffiliateDisclosure` `full`. 景表法 + ValueCommerce 第11条4項.
 * ASP names stay in `AFFILIATE_PR_NOTICE_DETAIL` (terms), not in chrome.
 */
export const AFFILIATE_PR_NOTICE =
  "外部リンクにはアフィリエイト広告を含みます。";

/** `/terms` only — names the ASPs. Do not paste into CTA chrome. */
export const AFFILIATE_PR_NOTICE_DETAIL =
  "当サイトの外部リンクにはアフィリエイト広告が含まれる場合があります（Amazonアソシエイト、楽天アフィリエイト、バリューコマース経由のYahoo!ショッピング・さとふる等）。";

/** Footer one-liner. */
export const TASTE_DISCLAIMER =
  "味わい評価はKomeSomme独自基準による目安です。";

/** Brand overlay / library dossier. */
export const TASTE_DISCLAIMER_DETAIL =
  "味わい評価はKomeSomme独自基準による目安です。公的な認定・等級を示すものではありません。";

/** ValueCommerce MyLink / 自由テキスト. SID+PID が揃うまでプレーン URL のまま。 */
export const VALUE_COMMERCE_REFERRAL_HTTPS =
  "https://ck.jp.ap.valuecommerce.com/servlet/referral";

/** Yahoo Shopping API `affiliate_id` が要求する http 形式。 */
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

/**
 * 第14条: 登録済みアフィリエイトサイト以外への広告コード掲載禁止。
 * Preview / 未フラグのローカルでは SID があっても包まない。
 */
export function valueCommerceWrapEnabled(): boolean {
  const flag = process.env.VALUE_COMMERCE_WRAP?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  if (flag === "1" || flag === "true" || flag === "on") return true;
  return process.env.VERCEL_ENV?.trim() === "production";
}

/** SID+PID が揃うまで素の URL。既に VC 転鎖なら二重に包まない。 */
export function wrapValueCommerceIfReady(
  targetUrl: string,
  sid?: string,
  pid?: string
): string {
  if (!valueCommerceWrapEnabled()) return targetUrl;
  const s = sid?.trim() ?? "";
  const p = pid?.trim() ?? "";
  if (!s || !p) return targetUrl;
  if (/valuecommerce\.com/i.test(targetUrl)) return targetUrl;
  return valueCommerceReferralUrl(targetUrl, s, p);
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
  satofull: string;
  yahooFurusato: string;
  rakutenFurusato: string;
} {
  const shop = shopQuery(input);
  const furusato = furusatoQuery(input);
  return {
    amazon: amazonSearchUrl(shop),
    yahoo: yahooShoppingSearchUrl(shop),
    satofull: satofullSearchUrl(furusato),
    yahooFurusato: yahooFurusatoSearchUrl(furusato),
    rakutenFurusato: rakutenFurusatoSearchUrl(furusato),
  };
}
