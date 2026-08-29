/**
 * Rakuten Ichiba Item Search (2026-07-01).
 * Server-only: applicationId and accessKey must never reach the browser.
 *
 * Docs: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 */

import { request as httpsRequest } from "node:https"

import { rakutenSearchUrl, wrapRakutenAffiliateUrl } from "./affiliate"

const ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701"

/** 食品 > 米・雑穀 */
export const RAKUTEN_RICE_GENRE_ID = 110472

const NG_KEYWORDS = "訳あり 古米 欠け米 砕米 米粉 米菓 煎餅"

export type RakutenRecommend = {
  url: string
  source: "item" | "search"
  itemName?: string
  itemPrice?: number
  itemCode?: string
}

type IchibaItem = {
  itemName?: string
  itemCode?: string
  itemPrice?: number
  itemUrl?: string
  affiliateUrl?: string
  availability?: number
  reviewCount?: number
  reviewAverage?: number
}

function rakutenServerEnv() {
  return {
    applicationId: process.env.RAKUTEN_APPLICATION_ID?.trim() ?? "",
    accessKey: process.env.RAKUTEN_ACCESS_KEY?.trim() ?? "",
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID?.trim() ?? process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID?.trim() ?? "",
  }
}

export function isRakutenIchibaConfigured(): boolean {
  const { applicationId, accessKey } = rakutenServerEnv()
  return Boolean(applicationId && accessKey)
}

function searchFallback(keyword: string): RakutenRecommend {
  const { affiliateId } = rakutenServerEnv()
  return {
    url: wrapRakutenAffiliateUrl(rakutenSearchUrl(keyword), affiliateId),
    source: "search",
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function itemsFromBody(body: unknown): IchibaItem[] {
  const root = asRecord(body)
  if (!root) return []
  const raw = root.items ?? root.Items
  if (!Array.isArray(raw)) return []

  return raw.flatMap((row) => {
    const record = asRecord(row)
    if (!record) return []
    const inner = record.item ?? record.Item
    const item = asRecord(inner) ?? record
    return [
      {
        itemName: typeof item.itemName === "string" ? item.itemName : undefined,
        itemCode: typeof item.itemCode === "string" ? item.itemCode : undefined,
        itemPrice: typeof item.itemPrice === "number" ? item.itemPrice : undefined,
        itemUrl: typeof item.itemUrl === "string" ? item.itemUrl : undefined,
        affiliateUrl: typeof item.affiliateUrl === "string" ? item.affiliateUrl : undefined,
        availability: typeof item.availability === "number" ? item.availability : undefined,
        reviewCount: typeof item.reviewCount === "number" ? item.reviewCount : undefined,
        reviewAverage: typeof item.reviewAverage === "number" ? item.reviewAverage : undefined,
      },
    ]
  })
}

function compact(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase()
}

function scoreItem(item: IchibaItem, brandName: string, keyword: string): number {
  const name = item.itemName ?? ""
  if (!name) return -1

  let score = 0
  const nameCompact = compact(name)
  const brandCompact = compact(brandName)

  if (brandCompact && nameCompact.includes(brandCompact)) score += 80
  else if (brandName && name.includes(brandName)) score += 50

  if (keyword.includes("5kg") && /5\s*kg|５ｋｇ|5キロ/.test(name)) score += 20
  if (keyword.includes("白米") && name.includes("白米")) score += 10
  if (keyword.includes("玄米") && name.includes("玄米")) score += 12
  if (item.availability === 1) score += 8
  if ((item.reviewCount ?? 0) >= 10) score += 6
  if ((item.reviewAverage ?? 0) >= 4) score += 4
  if (/[23]0\s*kg|20キロ|30キロ/.test(name) && !/20kg|30kg/.test(keyword)) score -= 20
  if (/訳あり|欠け|古米|業務用/.test(name)) score -= 30

  return score
}

function siteOrigin(): { origin: string; referer: string } {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://komesomme.vercel.app"
  const origin = raw.replace(/\/+$/, "")
  return { origin, referer: `${origin}/` }
}

function httpsGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(url, { method: "GET", headers }, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (chunk) => chunks.push(chunk as Buffer))
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8"),
        })
      })
    })
    req.on("error", reject)
    req.end()
  })
}

async function searchIchiba(keyword: string): Promise<IchibaItem[]> {
  const { applicationId, accessKey, affiliateId } = rakutenServerEnv()
  const params = new URLSearchParams({
    applicationId,
    accessKey,
    format: "json",
    formatVersion: "2",
    keyword,
    genreId: String(RAKUTEN_RICE_GENRE_ID),
    hits: "10",
    page: "1",
    availability: "1",
    imageFlag: "1",
    field: "1",
    NGKeyword: NG_KEYWORDS,
    elements: "itemName,itemCode,itemPrice,itemUrl,affiliateUrl,availability,reviewCount,reviewAverage",
  })
  if (affiliateId) params.set("affiliateId", affiliateId)

  const { origin, referer } = siteOrigin()
  const { status, body } = await httpsGet(`${ENDPOINT}?${params.toString()}`, {
    accessKey,
    Origin: origin,
    Referer: referer,
  })

  if (status === 404) return []
  if (status < 200 || status >= 300) {
    throw new Error(`Rakuten Ichiba search failed (${status}): ${body.slice(0, 200)}`)
  }

  return itemsFromBody(JSON.parse(body) as unknown)
}

function toRecommend(item: IchibaItem): RakutenRecommend | null {
  const rawUrl = item.affiliateUrl || item.itemUrl
  if (!rawUrl) return null
  const { affiliateId } = rakutenServerEnv()
  return {
    url: wrapRakutenAffiliateUrl(rawUrl, affiliateId),
    source: "item",
    itemName: item.itemName,
    itemPrice: item.itemPrice,
    itemCode: item.itemCode,
  }
}

/**
 * Pick one in-stock rice listing for the brand keyword.
 * Falls back to an affiliate-wrapped keyword search when the API is unset or empty.
 */
export async function recommendRakutenItem(params: {
  keyword: string
  brandName: string
}): Promise<RakutenRecommend> {
  const keyword = params.keyword.trim()
  const fallback = searchFallback(keyword)

  if (!keyword || !isRakutenIchibaConfigured()) return fallback

  try {
    const items = await searchIchiba(keyword)
    const ranked = items
      .map((item) => ({ item, score: scoreItem(item, params.brandName, keyword) }))
      .filter((row) => row.score >= 40)
      .sort((a, b) => b.score - a.score)

    const picked = ranked[0]?.item
    const recommend = picked ? toRecommend(picked) : null
    return recommend ?? fallback
  } catch (cause) {
    console.error("recommendRakutenItem:", cause)
    return fallback
  }
}
