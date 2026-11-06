import {
  PREFECTURE_MAP_PATHS,
  PREFECTURE_MAP_VIEWBOX,
} from "@/data/editorial/prefectureMapPaths";
import { riceProfiles } from "@/data/rice/catalog";
import { regionColor } from "@/lib/rice/regions";

/**
 * Shared card for the /prefectures OG images: the clickable map's geometry
 * (svg-japan, MIT) in region colours on the right, the page's words on the
 * left — the collections card's layout, with the map standing in for art.
 * Fills come from the catalogue, exactly as on the live map: a prefecture
 * with brands wears its region colour, the rest stay pale.
 *
 * SVG presentation attributes do not resolve CSS var() — use hex tokens.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const PAPER = "#F6EBDD";
const INK = "#302820";
const BROWN = "#704522";
const GOLD = "#D49A2A";
const NO_DATA_FILL = "#E7DFCC";
const FRAME = "#D9C8A9";

const OKINAWA_VIEWBOX = "66 444 42 44";

const REGION_BY_PREFECTURE = new Map<string, string>();
for (const profile of riceProfiles) {
  if (!REGION_BY_PREFECTURE.has(profile.prefecture)) {
    REGION_BY_PREFECTURE.set(profile.prefecture, profile.region);
  }
}

/** How many prefectures the catalogue knows (the index card's count). */
export const PREFECTURES_WITH_BRANDS = REGION_BY_PREFECTURE.size;

function fillFor(name: string, highlight: string | null): string {
  if (highlight && name === highlight) return GOLD;
  const region = REGION_BY_PREFECTURE.get(name);
  return region ? regionColor(region) : NO_DATA_FILL;
}

function JapanMap({
  highlight,
  height,
}: {
  highlight: string | null;
  height: number;
}) {
  const okinawa = PREFECTURE_MAP_PATHS.find((path) => path.code === 47);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
      }}
    >
      <svg viewBox={PREFECTURE_MAP_VIEWBOX} height={height} width={Math.round(height * (437.33 / 516.02))}>
        {PREFECTURE_MAP_PATHS.map((path) => (
          <path
            key={path.code}
            d={path.d}
            fill={fillFor(path.name, highlight)}
            stroke={highlight && path.name === highlight ? INK : PAPER}
            strokeWidth={highlight && path.name === highlight ? 1.6 : 0.8}
          />
        ))}
      </svg>
      {okinawa ? (
        <div
          style={{
            position: "absolute",
            left: 6,
            bottom: 6,
            width: 112,
            height: 114,
            display: "flex",
            background: PAPER,
            border: `2px solid ${FRAME}`,
          }}
        >
          <svg viewBox={OKINAWA_VIEWBOX} width={108} height={110}>
            <path
              d={okinawa.d}
              fill={fillFor(okinawa.name, highlight)}
              stroke={highlight && okinawa.name === highlight ? INK : PAPER}
              strokeWidth={highlight && okinawa.name === highlight ? 0.5 : 0.3}
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
}

export function PrefectureOgCard({
  eyebrow,
  title,
  dek,
  highlight,
}: {
  eyebrow: string;
  title: string;
  dek: string;
  /** Prefecture name to pick out in gold, or null for the index card. */
  highlight: string | null;
}) {
  return (
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
          width: 520,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 8px 56px 64px",
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
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontFamily: "Noto Serif JP",
            fontSize: 62,
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
            marginTop: 28,
            width: 72,
            height: 5,
            background: GOLD,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontFamily: "Noto Sans JP",
            fontSize: 23,
            lineHeight: 1.6,
            color: BROWN,
          }}
        >
          {dek}
        </div>
      </div>
      <div
        style={{
          width: 680,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <JapanMap highlight={highlight} height={566} />
      </div>
    </div>
  );
}
