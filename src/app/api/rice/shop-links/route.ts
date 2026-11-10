import { NextResponse } from "next/server";
import { findRiceProfile } from "@/data/rice/catalog";
import {
  amazonSearchUrl,
  furusatoQuery,
  isValueCommerceReferralHref,
  mercariSearchUrl,
  rakutenFurusatoSearchUrl,
  shopQuery,
  valueCommerceImpressionPixelUrl,
  valueCommerceWrapEnabled,
  wrapSatofullSearchUrl,
  wrapYahooSearchUrl,
  yahooFurusatoSearchUrl,
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
  mercari: string;
  satofull: string;
  rakutenFurusato: string;
  yahooFurusato: string;
  /** VC impression pixel, present only when the Yahoo href is VC-wrapped. */
  yahooImpression?: string;
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

  // VC Yahoo が使える間は、手貼り公式短鎖より VC の商品/検索リンクを優先する
  // （短鎖は VC 未承認時代の暫定措置。docs/14 §4）。短鎖テーブルは残し、
  // VC を止めたら自動で従来動作に戻る。
  const vcYahooReady =
    valueCommerceWrapEnabled() && Boolean(yahooSid && yahooPid);
  const yahooPromo = vcYahooReady
    ? undefined
    : await lookupYahooPromoUrl(rice.id);
  const yahooSearch = wrapYahooSearchUrl(shop, yahooSid, yahooPid);
  const yahooFurusatoSearch = yahooFurusatoSearchUrl(furusato);

  const impressionFor = (yahooHref: string): string | undefined =>
    vcYahooReady && yahooSid && yahooPid && isValueCommerceReferralHref(yahooHref)
      ? valueCommerceImpressionPixelUrl(yahooSid, yahooPid)
      : undefined;

  const fallbackYahoo = resolveYahooShopHref(yahooPromo, yahooSearch);
  const fallback: ShopLinks = {
    amazon: amazonSearchUrl(shop),
    rakuten: wrapRakutenAffiliateUrl(rakutenSearchUrl(shop)),
    yahoo: fallbackYahoo,
    mercari: mercariSearchUrl(shop),
    satofull: wrapSatofullSearchUrl(furusato, satofullSid, satofullPid),
    rakutenFurusato: wrapRakutenAffiliateUrl(rakutenFurusatoSearchUrl(furusato)),
    yahooFurusato: yahooFurusatoSearch,
    yahooImpression: impressionFor(fallbackYahoo),
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

  const finalYahoo = resolveYahooShopHref(yahooPromo, yahooItem);
  const links: ShopLinks = {
    amazon: fallback.amazon,
    rakuten: rakuten.url,
    yahoo: finalYahoo,
    mercari: fallback.mercari,
    satofull: fallback.satofull,
    rakutenFurusato: fallback.rakutenFurusato,
    yahooFurusato: fallback.yahooFurusato,
    yahooImpression: impressionFor(finalYahoo),
  };

  return json(links);
}
