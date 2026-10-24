import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { COLLECTION_ART_FILES } from "@/data/editorial/artManifest";
import { loadOgFonts } from "@/lib/og/fonts";

/**
 * Satori does not decode the collection WebP files. These JPEGs are cover
 * crops of `public/brand-art/collections/*.webp` at the card's left pane.
 */
const OG_ART_DIR = path.join(process.cwd(), "public", "brand-art", "collections", "og");

export const alt = "KomeSomme 特集";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return EDITORIAL_COLLECTIONS.map((row) => ({ slug: row.slug }));
}

const PAPER = "#F6EBDD";
const INK = "#302820";
const BROWN = "#704522";

const ART_W = 760;

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default async function CollectionOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = EDITORIAL_COLLECTIONS.find((row) => row.slug === slug);
  const fonts = await loadOgFonts();
  const artFile = collection?.artFile;
  let artSrc: string | null = null;
  if (artFile && COLLECTION_ART_FILES.has(artFile)) {
    const jpegName = artFile.replace(/\.webp$/i, ".jpg");
    const buf = await readFile(path.join(OG_ART_DIR, jpegName));
    artSrc = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }

  const title = collection?.title ?? "特集";
  const dek = clip(collection?.dek ?? "侍米師の特集です。", 72);

  return new ImageResponse(
    (
      <div
        lang="ja"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
        }}
      >
        <div
          style={{
            width: ART_W,
            height: size.height,
            display: "flex",
            overflow: "hidden",
            background: PAPER,
          }}
        >
          {artSrc ? (
            <img src={artSrc} width={ART_W} height={size.height} alt="" />
          ) : null}
        </div>
        <div
          style={{
            width: size.width - ART_W,
            height: size.height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Noto Sans JP",
              fontSize: 22,
              color: BROWN,
            }}
          >
            KomeSomme · 特集
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontFamily: "Noto Serif JP",
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 1.25,
              color: INK,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontFamily: "Noto Sans JP",
              fontSize: 22,
              lineHeight: 1.5,
              color: BROWN,
            }}
          >
            {dek}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
