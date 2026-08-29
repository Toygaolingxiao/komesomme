import { NextResponse } from "next/server";
import { findRiceProfile } from "@/data/rice/catalog";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { recommendRakutenItem } from "@/lib/rakuten/ichiba";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { takeToken } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;

/**
 * Resolve a Rakuten Ichiba recommendation URL for one catalog brand.
 * App ID / access key stay on the server. Unknown ids do not proxy arbitrary keywords.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ message: "id は必須です。" }, { status: 400 });
  }

  const rice = findRiceProfile(id);
  if (!rice) {
    return NextResponse.json({ message: "銘柄が見つかりません。" }, { status: 404 });
  }

  const keyword = riceRakutenKeyword(rice);
  const fallbackUrl = wrapRakutenAffiliateUrl(rakutenSearchUrl(keyword));

  const ip = clientIpFromRequest(request);
  const limit = takeToken(`rakuten:m:${ip}`, 40, MINUTE_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { url: fallbackUrl, source: "search" as const },
      { headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const result = await recommendRakutenItem({
    keyword,
    brandName: rice.name,
  });

  return NextResponse.json({ url: result.url, source: result.source });
}
