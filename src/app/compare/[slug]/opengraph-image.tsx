import { ImageResponse } from "next/og";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import { resolveComparisonBySlug } from "@/lib/editorial/comparisons";
import { loadOgFonts } from "@/lib/og/fonts";

export const alt = "KomeSomme 銘柄くらべ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return COMPARISON_PAGES.map((page) => ({ slug: page.slug }));
}

const CREAM = "#FFF5E5";
const INK = "#302820";
const INK_SOFT = "#5C4A3A";
const GOLD = "#D49A2A";

export default async function CompareOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fonts = await loadOgFonts();
  const resolved = resolveComparisonBySlug(slug);
  const headline = resolved
    ? `${resolved.a.name}と${resolved.b.name}、どう違う？`
    : "銘柄くらべ";
  const dek = resolved?.page.dek ?? "甘みと粒感から、2つの銘柄を並べて比べる";

  return new ImageResponse(
    <div
      lang="ja"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CREAM,
        padding: "56px 64px",
        fontFamily: "Noto Serif JP",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            color: GOLD,
            fontSize: 28,
            fontFamily: "Noto Sans JP",
          }}
        >
          KomeSomme · 銘柄くらべ
        </div>
        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: 58,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            color: INK_SOFT,
            fontSize: 27,
            lineHeight: 1.5,
            maxWidth: 980,
            fontFamily: "Noto Sans JP",
          }}
        >
          {dek.length > 70 ? `${dek.slice(0, 69)}…` : dek}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          color: INK_SOFT,
          fontSize: 24,
          fontFamily: "Noto Sans JP",
        }}
      >
        12指標の並排表と、味わいの地図での位置で比べます
      </div>
    </div>,
    { ...size, fonts },
  );
}
