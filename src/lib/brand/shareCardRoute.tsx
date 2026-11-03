import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { findRiceProfile } from "@/data/rice/catalog";
import { ShareCardImage } from "@/lib/brand/shareCardImage";
import { SHARE_CARD_SIZE, shareCardInkArtFile } from "@/lib/brand/shareCard";
import { isShareCardEnabled } from "@/lib/brand/shareCardEnabled";
import { shareCardQrDataUrl } from "@/lib/brand/shareCardQr";
import { loadOgFonts } from "@/lib/og/fonts";
import { getSiteUrl } from "@/lib/site";

const inkArtCache = new Map<string, Promise<string | null>>();

const SHARE_DIR = path.join(process.cwd(), "public", "share");

function getInkArtDataUrl(riceId: string): Promise<string | null> {
  const file = shareCardInkArtFile(riceId);
  const cached = inkArtCache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const buf = await readFile(path.join(SHARE_DIR, "ink", file));
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      try {
        const buf = await readFile(path.join(SHARE_DIR, "cooked-rice.jpg"));
        return `data:image/jpeg;base64,${buf.toString("base64")}`;
      } catch {
        return null;
      }
    }
  })();

  inkArtCache.set(file, promise);
  return promise;
}

function publicPageUrl(id: string): { hostLine: string; absoluteUrl: string } {
  const raw = getSiteUrl().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const host =
    raw.includes("localhost") || raw.includes("vercel.app")
      ? "komesomme.jp"
      : raw;
  return {
    hostLine: `${host}/library/${id}`,
    absoluteUrl: `https://${host}/library/${id}`,
  };
}

/**
 * Renders one share card. Shared by the two routes (plain / QR): both are
 * prerendered at build time via generateStaticParams, so this normally runs
 * during `next build`, not per request. The card depends only on static
 * catalogue data.
 */
export async function renderShareCard(
  id: string,
  withQr: boolean
): Promise<Response> {
  if (!isShareCardEnabled()) {
    return new Response("Share card disabled", { status: 404 });
  }

  const rice = findRiceProfile(id);
  if (!rice) {
    return new Response("Not found", { status: 404 });
  }

  const { hostLine, absoluteUrl } = publicPageUrl(rice.id);

  const [fonts, heroPhotoDataUrl] = await Promise.all([
    loadOgFonts(),
    getInkArtDataUrl(rice.id),
  ]);
  const qrDataUrl = withQr ? shareCardQrDataUrl(absoluteUrl) : null;

  return new ImageResponse(
    (
      <ShareCardImage
        rice={rice}
        hostLine={hostLine}
        qrDataUrl={qrDataUrl}
        heroPhotoDataUrl={heroPhotoDataUrl}
      />
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts,
      headers: {
        "Content-Type": "image/png",
        // Prerendered responses are served as static files; these headers
        // still govern the on-demand fallback for ids not in the catalogue
        // snapshot, where shared caches should hold the result the same way.
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="${rice.id}-komesomme${withQr ? "-qr" : ""}.png"`,
      },
    }
  );
}
