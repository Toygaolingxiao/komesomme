/**
 * Client-safe Rakuten affiliate helpers.
 * Application ID / access key stay in server-only modules.
 */

const AFFILIATE_ID_RE = /^[A-Za-z0-9._-]+$/

export function publicRakutenAffiliateId(): string {
  return process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID?.trim() ?? ""
}

/**
 * ガイドライン: 未登録メディアへのリンク掲載禁止。
 * Preview / 未フラグのローカルでは ID があっても包まない。
 */
export function rakutenAffiliateWrapEnabled(): boolean {
  const flag = process.env.RAKUTEN_AFFILIATE_WRAP?.trim().toLowerCase()
  if (flag === "0" || flag === "false" || flag === "off") return false
  if (flag === "1" || flag === "true" || flag === "on") return true
  return process.env.VERCEL_ENV?.trim() === "production"
}

export function rakutenSearchUrl(keyword: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`
}

/** Wrap a Rakuten Ichiba URL so clicks are attributed, when an affiliate ID is set. */
export function wrapRakutenAffiliateUrl(url: string, affiliateId = publicRakutenAffiliateId()): string {
  if (!rakutenAffiliateWrapEnabled()) return url
  if (!affiliateId || !AFFILIATE_ID_RE.test(affiliateId)) return url
  if (url.includes("hb.afl.rakuten.co.jp")) return url
  return `https://hb.afl.rakuten.co.jp/ichiba/${affiliateId}/?pc=${encodeURIComponent(url)}`
}
