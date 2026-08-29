/**
 * Yahoo! Shopping Item Search (V1). Server-only.
 * https://developer.yahoo.co.jp/webapi/shopping/shopping/v1/itemsearch.html
 */

import {
  valueCommerceWrapEnabled,
  wrapValueCommerceIfReady,
  wrapYahooSearchUrl,
  yahooValueCommerceAffiliateId,
} from "@/lib/affiliate";

const ENDPOINT = "https://shopping.yahooapis.jp/ShoppingWebService/V1/itemSearch";

function yahooEnv() {
  return {
    clientId: process.env.YAHOO_CLIENT_ID?.trim() ?? "",
    sid: process.env.YAHOO_VC_SID?.trim() ?? "",
    pid: process.env.YAHOO_VC_PID?.trim() ?? "",
  };
}

function firstHitUrl(xml: string): string | null {
  const hit = xml.match(/<Hit\b[\s\S]*?<\/Hit>/i)?.[0];
  if (!hit) return null;
  const url = hit.match(/<Url>([^<]+)<\/Url>/i)?.[1]?.trim();
  return url || null;
}

export async function yahooShoppingItemUrl(query: string): Promise<string> {
  const { clientId, sid, pid } = yahooEnv();
  const fallback = wrapYahooSearchUrl(query, sid, pid);

  if (!clientId || !query.trim()) return fallback;

  const params = new URLSearchParams({
    appid: clientId,
    query: query.trim(),
    hits: "1",
    availability: "1",
  });
  if (sid && pid && valueCommerceWrapEnabled()) {
    params.set("affiliate_type", "vc");
    params.set("affiliate_id", yahooValueCommerceAffiliateId(sid, pid));
  }

  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/xml" },
    });
    if (!response.ok) {
      console.error(`Yahoo itemSearch failed (${response.status})`);
      return fallback;
    }
    const xml = await response.text();
    const url = firstHitUrl(xml);
    return url ? wrapValueCommerceIfReady(url, sid, pid) : fallback;
  } catch (cause) {
    console.error("yahooShoppingItemUrl:", cause);
    return fallback;
  }
}
