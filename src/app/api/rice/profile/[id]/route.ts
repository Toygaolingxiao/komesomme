import { NextResponse } from "next/server";
import { findRiceProfile } from "@/data/rice/catalog";

export const runtime = "nodejs";

/**
 * Full profile for one brand, read from the local catalogue.
 *
 * The home page ships only the map projection of every brand; the detail
 * panel fetches the editorial long text and pairing lists from here when
 * a brand is opened. Catalogue content changes only on deploy, so the
 * response is CDN-cacheable like the share-card image.
 */
const PROFILE_CACHE = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
} as const;

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const rice = findRiceProfile(id);
  if (!rice) {
    return NextResponse.json(
      { message: "銘柄が見つかりません。" },
      { status: 404, headers: NO_STORE }
    );
  }
  return NextResponse.json(rice, { headers: PROFILE_CACHE });
}
