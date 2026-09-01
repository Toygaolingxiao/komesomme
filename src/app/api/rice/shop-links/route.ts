import { NextResponse } from "next/server";
import { findRiceProfile } from "@/data/rice/catalog";
import {
  amazonSearchUrl,
  furusatoQuery,
  rakutenFurusatoSearchUrl,
  shopQuery,
  wrapSatofullSearchUrl,
  wrapYahooFurusatoSearchUrl,
  wrapYahooSearchUrl,
} from "@/lib/affiliate";
import { yahooShoppingItemUrl } from "@/lib/affiliate/yahoo";
import { resolveYahooShopHref } from "@/lib/affiliate/yahooShortLinks";
import { lookupYahooPromoUrl } from "@/lib/affiliate/yahooPromo";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { recommendRakutenItem } from "@/lib/rakuten/ichiba";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { takeToken } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;
const NO_STORE = { "Cache-Control": "private, no-store" } as const;

function json(body: unknown, status = 200, extra?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE, ...extra },
  });
}

export type ShopLinks = {
  amazon: string;
  rakuten: string;
  yahoo: string;
  satofull: string;
  rakutenFurusato: string;
  yahooFurusato: string;
};

/**
 * Resolve mall hrefs for one catalog brand.
 * The card only receives URLs — API product copy is never mixed into other malls.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return json({ message: "id は必須です。" }, 400);
  }

  const rice = findRiceProfile(id);
  if (!rice) {
    return json({ message: "銘柄が見つかりません。" }, 404);
  }

  const shop =
    riceRakutenKeyword(rice) ||
    shopQuery({ prefecture: rice.prefecture, brand: rice.name });
  const furusato =
    rice.furusato_keywords?.[0]?.trim() ||
    furusatoQuery({ prefecture: rice.prefecture, brand: rice.name });

  const yahooSid = process.env.YAHOO_VC_SID?.trim();
  const yahooPid = process.env.YAHOO_VC_PID?.trim();
  const satofullSid = process.env.SATOFULL_VC_SID?.trim();
  const satofullPid = process.env.SATOFULL_VC_PID?.trim();

  const yahooPromo = await lookupYahooPromoUrl(rice.id);
  const yahooSearch = wrapYahooSearchUrl(shop, yahooSid, yahooPid);

  const fallback: ShopLinks = {
    amazon: amazonSearchUrl(shop),
    rakuten: wrapRakutenAffiliateUrl(rakutenSearchUrl(shop)),
    yahoo: resolveYahooShopHref(yahooPromo, yahooSearch),
    satofull: wrapSatofullSearchUrl(furusato, satofullSid, satofullPid),
    rakutenFurusato: wrapRakutenAffiliateUrl(rakutenFurusatoSearchUrl(furusato)),
    yahooFurusato: wrapYahooFurusatoSearchUrl(furusato, yahooSid, yahooPid),
  };

  const ip = clientIpFromRequest(request);
  const limit = takeToken(`shop:m:${ip}`, 40, MINUTE_MS);
  if (!limit.ok) {
    return json(fallback, 200, { "Retry-After": String(limit.retryAfterSec) });
  }

  const [rakuten, yahooItem] = await Promise.all([
    recommendRakutenItem({ keyword: shop, brandName: rice.name }),
    yahooPromo ? Promise.resolve(yahooPromo) : yahooShoppingItemUrl(shop),
  ]);

  const links: ShopLinks = {
    amazon: fallback.amazon,
    rakuten: rakuten.url,
    yahoo: resolveYahooShopHref(yahooPromo, yahooItem),
    satofull: fallback.satofull,
    rakutenFurusato: fallback.rakutenFurusato,
    yahooFurusato: fallback.yahooFurusato,
  };

  return json(links);
}
