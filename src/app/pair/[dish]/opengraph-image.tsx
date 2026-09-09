import { ImageResponse } from "next/og";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { resolvePairingBySlug } from "@/lib/editorial/pairings";
import { loadOgFonts } from "@/lib/og/fonts";

export const alt = "KomeSomme 料理で選ぶ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return PAIRING_PAGES.map((page) => ({ dish: page.slug }));
}

const CREAM = "#FFF5E5";
const INK = "#302820";
const INK_SOFT = "#5C4A3A";
const BROWN = "#704522";
const GOLD = "#D49A2A";

export default async function PairOpenGraphImage({
  params,
}: {
  params: Promise<{ dish: string }>;
}) {
  const { dish } = await params;
  const fonts = await loadOgFonts();
  const resolved = resolvePairingBySlug(dish);
  const label = resolved?.page.dishLabel ?? "料理";
  const dek = resolved?.page.dek ?? "甘みと粒感から米を選ぶ";
  const topNames = (resolved?.top ?? []).slice(0, 3).map((rice) => rice.name);

  return new ImageResponse(
    (
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
          <div style={{ display: "flex", color: GOLD, fontSize: 28, fontFamily: "Noto Sans JP" }}>
            KomeSomme · 料理で選ぶ
          </div>
          <div
            style={{
              display: "flex",
              color: INK,
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {label}に合う米
          </div>
          <div
            style={{
              display: "flex",
              color: INK_SOFT,
              fontSize: 28,
              lineHeight: 1.45,
              maxWidth: 980,
              fontFamily: "Noto Sans JP",
            }}
          >
            {dek.length > 70 ? `${dek.slice(0, 69)}…` : dek}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topNames.map((name, index) => (
            <div
              key={name}
              style={{
                display: "flex",
                color: BROWN,
                fontSize: 26,
                fontFamily: "Noto Sans JP",
              }}
            >
              {String(index + 1).padStart(2, "0")}　{name}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
