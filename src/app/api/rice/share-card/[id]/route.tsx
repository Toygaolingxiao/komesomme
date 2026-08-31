import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { findRiceProfile } from "@/data/rice/catalog";
import { ShareCardImage } from "@/lib/brand/shareCardImage";
import { SHARE_CARD_SIZE, shareCardInkArtFile } from "@/lib/brand/shareCard";
import { isShareCardEnabled } from "@/lib/brand/shareCardEnabled";
import { shareCardQrDataUrl } from "@/lib/brand/shareCardQr";
import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type FontPack = { sans: ArrayBuffer; serif: ArrayBuffer };

let fontPackPromise: Promise<FontPack> | null = null;
const inkArtCache = new Map<string, Promise<string | null>>();

const SHARE_DIR = path.join(process.cwd(), "public", "share");

async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  const buf = await readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function getFonts(): Promise<FontPack> {
  if (!fontPackPromise) {
    fontPackPromise = Promise.all([
      readArrayBuffer(path.join(SHARE_DIR, "fonts", "NotoSansJP-500.ttf")),
      readArrayBuffer(path.join(SHARE_DIR, "fonts", "NotoSerifJP-700.ttf")),
    ])
      .then(([sans, serif]) => ({ sans, serif }))
      .catch((error) => {
        fontPackPromise = null;
        throw error;
      });
  }
  return fontPackPromise;
}

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

function wantsQr(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const v = url.searchParams.get("qr");
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

export async function GET(request: Request, { params }: RouteProps) {
  if (!isShareCardEnabled()) {
    return new Response("Share card disabled", { status: 404 });
  }

  const { id } = await params;
  const rice = findRiceProfile(id);
  if (!rice) {
    return new Response("Not found", { status: 404 });
  }

  const withQr = wantsQr(request);
  const { hostLine, absoluteUrl } = publicPageUrl(rice.id);

  const [{ sans, serif }, heroPhotoDataUrl] = await Promise.all([
    getFonts(),
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
      fonts: [
        { name: "Noto Sans JP", data: sans, style: "normal", weight: 500 },
        { name: "Noto Serif JP", data: serif, style: "normal", weight: 700 },
      ],
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="${rice.id}-komesomme${withQr ? "-qr" : ""}.png"`,
      },
    }
  );
}
