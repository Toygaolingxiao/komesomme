import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import manifest from "@/data/rice/encyclopedia/manifest.json";

/**
 * Collapse trailing-slash aliases before Next's built-in slash strip
 * (trailingSlash:false) turns /path/ → /path and creates a second hop.
 * www → apex is belt-and-suspenders; Vercel Domain Redirect may still
 * answer first with 307 — Cloudflare 301 is the durable fix.
 */

const APEX_HOST = "komesomme.jp";
const WWW_HOST = "www.komesomme.jp";

const BRAND_IDS = new Set(
  (manifest.entries ?? [])
    .map((row: { id?: string }) => row.id)
    .filter((id): id is string => typeof id === "string" && /^[a-z0-9-]+$/.test(id))
);

function permanentRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const { pathname } = request.nextUrl;

  if (host === WWW_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = APEX_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (
    process.env.VERCEL_ENV === "production" &&
    (pathname === "/prototypes" || pathname.startsWith("/prototypes/"))
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (pathname === "/collections/") {
    return permanentRedirect(request, "/discover");
  }

  const libCollection = pathname.match(/^\/library\/collections\/([^/]+)\/$/);
  if (libCollection?.[1]) {
    return permanentRedirect(request, `/collections/${libCollection[1]}`);
  }

  const brandSlash = pathname.match(/^\/([^/]+)\/$/);
  if (brandSlash?.[1] && BRAND_IDS.has(brandSlash[1])) {
    return permanentRedirect(request, `/library/${brandSlash[1]}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|brand-art|.*\\..*).*)",
  ],
};
