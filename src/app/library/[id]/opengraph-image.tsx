import { ImageResponse } from "next/og";
import { AXIS_POLES, INSET } from "@/components/matrix/shared";
import { findRiceProfile } from "@/data/rice/catalog";
import {
  encyclopediaManifest,
  loadEncyclopediaArticle,
} from "@/data/rice/encyclopedia/load";
import { loadOgFonts } from "@/lib/og/fonts";
import {
  calculateMatrixDisplayPoint,
  getSweetnessLabel,
  getTextureLabel,
  valueToPosition,
} from "@/lib/rice/matrix";
import { regionColor } from "@/lib/rice/regions";

export const alt = "KomeSomme 銘柄ライブラリ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Prerender all 100+ cards so a satori failure breaks the build, not production. */
export function generateStaticParams() {
  return encyclopediaManifest().map((entry) => ({ id: entry.id }));
}

const CREAM = "#FFF5E5";
const PAPER = "#FFFDF6";
const INK = "#302820";
const INK_SOFT = "#5C4A3A";
const BROWN = "#704522";
const HAIRLINE = "#E0CFAF";

const MAP_SIZE = 300;
/** Keeps a max-value dot inside the frame instead of straddling the border. */
const MAP_PAD = 18;
const PLOT = MAP_SIZE - MAP_PAD * 2;
const DOT = 26;

/** Same orientation as the site map: x left→right = すっきり→甘み, y up = ほどける. */
function dotOffset(rice: Parameters<typeof calculateMatrixDisplayPoint>[0]) {
  const point = calculateMatrixDisplayPoint(rice);
  return {
    left: MAP_PAD + (valueToPosition(point.display_x, INSET) / 100) * PLOT,
    top: MAP_PAD + ((100 - valueToPosition(point.display_y, INSET)) / 100) * PLOT,
  };
}

function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        border: `1px solid ${HAIRLINE}`,
        background: PAPER,
        borderRadius: 999,
        padding: "8px 20px",
        fontSize: 22,
        color: INK_SOFT,
      }}
    >
      {text}
    </div>
  );
}

function Fallback({ fonts }: { fonts: Awaited<ReturnType<typeof loadOgFonts>> }) {
  return new ImageResponse(
    (
      <div
        lang="ja"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          fontFamily: "Noto Serif JP",
          fontSize: 56,
          color: INK,
        }}
      >
        KomeSomme 銘柄ライブラリ
      </div>
    ),
    { ...size, fonts }
  );
}

export default async function BrandOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rice = findRiceProfile(id);
  const article = loadEncyclopediaArticle(id);
  const fonts = await loadOgFonts();

  if (!rice) return Fallback({ fonts });

  const dot = dotOffset(rice);
  const headline = article?.headline?.trim() || rice.short_ || rice.description;
  const reading = article?.reading?.trim() ?? "";

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
          padding: "56px 72px",
          fontFamily: "Noto Sans JP",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
            <div style={{ fontSize: 20, letterSpacing: "0.18em", color: BROWN }}>
              銘柄ライブラリ
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: "Noto Serif JP",
                fontSize: rice.name.length > 8 ? 60 : 78,
                color: INK,
                lineHeight: 1.12,
              }}
            >
              {rice.name}
            </div>
            <div style={{ marginTop: 12, fontSize: 26, color: BROWN }}>
              {reading ? `${reading}・${rice.prefecture}` : rice.prefecture}
            </div>
            <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
              <Chip text={getSweetnessLabel(rice.sweetness)} />
              <Chip text={getTextureLabel(rice.hardness)} />
            </div>
            <div style={{ marginTop: 26, fontSize: 24, lineHeight: 1.5, color: INK_SOFT }}>
              {headline.length > 74 ? `${headline.slice(0, 73)}…` : headline}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                width: MAP_SIZE,
                height: MAP_SIZE,
                background: PAPER,
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 18,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: MAP_PAD,
                  top: MAP_SIZE / 2,
                  width: PLOT,
                  height: 1,
                  background: HAIRLINE,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: MAP_SIZE / 2,
                  top: MAP_PAD,
                  width: 1,
                  height: PLOT,
                  background: HAIRLINE,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: dot.left - DOT / 2,
                  top: dot.top - DOT / 2,
                  width: DOT,
                  height: DOT,
                  borderRadius: 999,
                  background: regionColor(rice.region),
                  border: `3px solid ${PAPER}`,
                }}
              />
            </div>
            {/* Axis copy sits outside the frame so it cannot collide with the dot. */}
            <div style={{ marginTop: 14, fontSize: 17, color: BROWN }}>
              {`横軸 ${AXIS_POLES.sweetLowShort} → ${AXIS_POLES.sweetHighShort}`}
            </div>
            <div style={{ marginTop: 4, fontSize: 17, color: BROWN }}>
              {`縦軸 ${AXIS_POLES.firmShort} → ${AXIS_POLES.softShort}`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: 22,
            fontSize: 22,
            color: BROWN,
          }}
        >
          <div style={{ letterSpacing: "0.04em" }}>KomeSomme｜味わいの地図で選ぶ</div>
          <div>{`komesomme.jp/library/${rice.id}`}</div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
