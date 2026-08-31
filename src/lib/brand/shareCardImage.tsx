import {
  CONTOUR_PATHS,
  GOLD_POINT,
  GRAIN_PATH,
  ORBIT_PATH,
  PROBE,
} from "@/components/brand/markGeometry";
import { AXIS_POLES } from "@/components/matrix/shared";
import { GUIDE_ROLE_ANNOTATED } from "@/lib/brand/guideRole";
import {
  SHARE_CARD_SIZE,
  SHARE_CARD_SLOGAN,
  shareCardConstellation,
  shareCardHeroPoint,
  shareCardScores,
  type ShareCardScore,
  type ShareCardStar,
} from "@/lib/brand/shareCard";
import { valueToPosition } from "@/lib/rice/matrix";
import { RICE_REGIONS, regionColor } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";

type Props = {
  rice: RiceProfileV2;
  hostLine: string;
  heroPhotoDataUrl?: string | null;
  qrDataUrl?: string | null;
};

const PAPER = "#F3E9DC";
const INK = "#2A221A";
const BROWN = "#6B4A2E";
const MUTED = "#8A735C";
const GOLD = "#C9952E";
const KM_BROWN = "#704522";
const CROSS = "rgba(212,154,42,0.38)";
/** Same inset as home TasteMap / ProfileNode. */
const INSET = 4;

function grainHash(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function grainTilt(id: string) {
  return (grainHash(id) % 50) - 25;
}

function ScoreBead({ lit }: { lit: boolean }) {
  const style = lit
    ? {
        display: "flex" as const,
        width: 15,
        height: 9,
        borderRadius: "50%",
        transform: "rotate(-18deg)",
        backgroundColor: GOLD,
        backgroundImage: `radial-gradient(circle at 28% 24%, rgba(255,253,247,0.55) 0%, rgba(255,253,247,0.15) 18%, ${GOLD} 42%)`,
        boxShadow:
          "0 0 0 1px rgba(138,90,24,0.28), 0 1px 2px rgba(112,69,34,0.16)",
      }
    : {
        display: "flex" as const,
        width: 15,
        height: 9,
        borderRadius: "50%",
        transform: "rotate(-18deg)",
        backgroundColor: "rgba(201,149,46,0.12)",
        boxShadow: "0 0 0 1px rgba(201,149,46,0.35)",
      };
  return <div style={style} />;
}

function ScoreBars({ scores }: { scores: ShareCardScore[] }) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 9,
        width: "100%",
      }}
    >
      {scores.map((score) => (
        <div
          key={score.label}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexShrink: 0,
              fontSize: 18,
              color: BROWN,
              letterSpacing: "0.04em",
              width: 148,
              whiteSpace: "nowrap",
            }}
          >
            {score.label}
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 5 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <ScoreBead key={n} lit={n <= score.value} />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              color: MUTED,
              letterSpacing: "0.02em",
            }}
          >
            {score.value}/5
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroArt({ dataUrl }: { dataUrl: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: 318,
        height: 268,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <img
        src={dataUrl}
        width={318}
        height={268}
        alt=""
        style={{
          display: "flex",
          width: 318,
          height: 268,
          objectFit: "cover",
          objectPosition: "50% 42%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(225deg, rgba(243,233,220,0) 52%, rgba(243,233,220,0.5) 100%)",
        }}
      />
    </div>
  );
}

function PoleCapsule({
  label,
  rotate = 0,
}: {
  label: string;
  rotate?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: KM_BROWN,
        color: "#fffdf7",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        borderRadius: 999,
        padding: rotate !== 0 ? "11px 8px" : "6px 14px",
        transform: `rotate(${rotate}deg)`,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(112,69,34,0.22)",
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function RegionLegend() {
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        width: "100%",
      }}
    >
      {RICE_REGIONS.map((region) => (
        <div
          key={region.id}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: region.color,
              boxShadow: "0 0 0 1px rgba(48,40,32,0.15)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 12,
              color: MUTED,
              letterSpacing: "0.02em",
            }}
          >
            {region.name}
          </div>
        </div>
      ))}
    </div>
  );
}

/** SVG beads — Satori mishandles 100+ absolute HTML nodes, so plot via viewBox. */
function MatrixBeadCloud({
  stars,
  hero,
  heroFill,
  heroId,
}: {
  stars: ShareCardStar[];
  hero: { display_x: number; display_y: number };
  heroFill: string;
  heroId: string;
}) {
  const VB = 1000;
  const rx = 9.5;
  const ry = 6;
  const heroRx = rx * 1.95;
  const heroRy = ry * 1.95;
  const hx = (valueToPosition(hero.display_x, INSET) / 100) * VB;
  const hy = ((100 - valueToPosition(hero.display_y, INSET)) / 100) * VB;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${VB} ${VB}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        display: "flex",
      }}
    >
      <defs>
        {RICE_REGIONS.map((region) => (
          <radialGradient
            key={region.id}
            id={`bead-${region.id}`}
            cx="32%"
            cy="28%"
            r="70%"
          >
            <stop offset="0%" stopColor="rgba(255,253,247,0.72)" />
            <stop offset="22%" stopColor={region.color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={region.color} />
          </radialGradient>
        ))}
        <radialGradient id="bead-hero" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="rgba(255,253,247,0.85)" />
          <stop offset="24%" stopColor={heroFill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={heroFill} />
        </radialGradient>
        <filter id="hero-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Crosshair like home MatrixGrid */}
      {[0, 0.5, 1].map((t) => {
        const p = t * VB;
        const emphasis = t === 0.5;
        return (
          <g key={t}>
            <line
              x1={p}
              y1={0}
              x2={p}
              y2={VB}
              stroke={emphasis ? CROSS : "rgba(112,69,34,0.1)"}
              strokeWidth={emphasis ? 2.2 : 1}
            />
            <line
              x1={0}
              y1={p}
              x2={VB}
              y2={p}
              stroke={emphasis ? CROSS : "rgba(112,69,34,0.1)"}
              strokeWidth={emphasis ? 2.2 : 1}
            />
          </g>
        );
      })}

      {stars.map((s) => {
        const x = (valueToPosition(s.display_x, INSET) / 100) * VB;
        const y = ((100 - valueToPosition(s.display_y, INSET)) / 100) * VB;
        const tilt = grainTilt(s.id);
        const regionId =
          RICE_REGIONS.find((r) => r.name === s.region)?.id ?? "national";
        return (
          <ellipse
            key={s.id}
            cx={x}
            cy={y}
            rx={rx}
            ry={ry}
            fill={`url(#bead-${regionId})`}
            transform={`rotate(${tilt} ${x} ${y})`}
            opacity={0.9}
            stroke="rgba(48,40,32,0.18)"
            strokeWidth={0.7}
          />
        );
      })}

      {/* Soft halo under hero */}
      <ellipse
        cx={hx}
        cy={hy}
        rx={heroRx * 2.1}
        ry={heroRy * 2.1}
        fill={heroFill}
        opacity={0.18}
      />
      <ellipse
        cx={hx}
        cy={hy}
        rx={heroRx}
        ry={heroRy}
        fill="url(#bead-hero)"
        transform={`rotate(${grainTilt(heroId)} ${hx} ${hy})`}
        filter="url(#hero-glow)"
        stroke="rgba(48,40,32,0.22)"
        strokeWidth={1.1}
      />
    </svg>
  );
}

function HeroTooltip({
  rice,
}: {
  rice: RiceProfileV2;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 148,
        padding: "10px 14px",
        borderRadius: 12,
        backgroundColor: "#fffdf7",
        border: "1px solid rgba(112,69,34,0.14)",
        boxShadow: "0 8px 18px rgba(112,69,34,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 12,
          color: "#e56b3f",
          letterSpacing: "0.04em",
          fontWeight: 700,
        }}
      >
        この銘柄
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 2,
          fontSize: 20,
          fontFamily: "Noto Serif JP",
          fontWeight: 700,
          color: INK,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {rice.name}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 2,
          fontSize: 13,
          color: MUTED,
        }}
      >
        {rice.prefecture}
      </div>
    </div>
  );
}

/**
 * Full-catalog tasting map — same layout language as home TasteMap:
 * cream plot plate, 4% inset, region-colored glossy ovals, brown pole capsules.
 */
function FullCatalogMatrix({
  rice,
  stars,
  hero,
}: {
  rice: RiceProfileV2;
  stars: ShareCardStar[];
  hero: { display_x: number; display_y: number };
}) {
  const hx = valueToPosition(hero.display_x, INSET);
  const hy = 100 - valueToPosition(hero.display_y, INSET);
  const heroFill = rice.region_color || regionColor(rice.region);
  const tooltipBelow = hero.display_y > 3.2;

  return (
    <div
      style={{
        marginTop: 18,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flexGrow: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 16,
            color: BROWN,
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          味わいの地図
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 13,
            color: MUTED,
            letterSpacing: "0.04em",
          }}
        >
          {`${stars.length + 1}銘柄の座標`}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 6,
        }}
      >
        <PoleCapsule label={AXIS_POLES.softShort} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          flexGrow: 1,
          minHeight: 0,
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PoleCapsule label={AXIS_POLES.sweetLowShort} rotate={-90} />
        </div>

        <div
          style={{
            position: "relative",
            flexGrow: 1,
            minHeight: 520,
            borderRadius: 22,
            overflow: "hidden",
            display: "flex",
            boxShadow: "0 12px 28px rgba(112,69,34,0.16)",
            border: "1px solid rgba(112,69,34,0.14)",
            backgroundColor: "#fff6ea",
            backgroundImage:
              "linear-gradient(180deg, #fffdf7 0%, #fff6ea 100%)",
          }}
        >
          <MatrixBeadCloud
            stars={stars}
            hero={hero}
            heroFill={heroFill}
            heroId={rice.id}
          />

          {/* Only the tooltip is HTML-absolute (one node — Satori-safe) */}
          <div
            style={{
              position: "absolute",
              left: `${hx}%`,
              top: `${hy}%`,
              display: "flex",
              marginLeft: -90,
              marginTop: tooltipBelow ? 22 : -130,
            }}
          >
            <HeroTooltip rice={rice} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PoleCapsule label={AXIS_POLES.sweetHighShort} rotate={90} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 6,
        }}
      >
        <PoleCapsule label={AXIS_POLES.firmShort} />
      </div>

      <RegionLegend />
    </div>
  );
}

/**
 * Xiaohongshu 3:4 poster — header / hero / full-catalog matrix / footer.
 */
export function ShareCardImage({
  rice,
  hostLine,
  heroPhotoDataUrl,
  qrDataUrl,
}: Props) {
  const scores = shareCardScores(rice);
  const stars = shareCardConstellation(rice);
  const hero = shareCardHeroPoint(rice);
  const nameSize =
    rice.name.length >= 8 ? 56 : rice.name.length >= 6 ? 66 : 74;

  return (
    <div
      lang="ja"
      style={{
        width: SHARE_CARD_SIZE.width,
        height: SHARE_CARD_SIZE.height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        backgroundImage:
          "radial-gradient(ellipse at 14% 4%, rgba(255,251,244,0.9) 0%, rgba(243,233,220,0) 38%), radial-gradient(ellipse at 92% 98%, rgba(210,180,140,0.38) 0%, rgba(243,233,220,0) 40%)",
        fontFamily: '"Noto Sans JP", sans-serif',
        padding: "36px 40px 26px",
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
            <circle
              cx="32"
              cy="32"
              r="31"
              fill="rgba(255,245,229,0.8)"
              stroke="rgba(112,69,34,0.12)"
              strokeWidth="1"
            />
            <g transform="translate(7.5 7) scale(0.77)">
              <path
                d={GRAIN_PATH}
                stroke={INK}
                strokeWidth="1.85"
                strokeLinejoin="round"
              />
              {CONTOUR_PATHS.map((d) => (
                <path
                  key={d}
                  d={d}
                  stroke={GOLD}
                  strokeWidth="0.85"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              ))}
              <path
                d={ORBIT_PATH}
                stroke={INK}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <line
                x1={PROBE.x1}
                y1={PROBE.y1}
                x2={PROBE.x2}
                y2={PROBE.y2}
                stroke="#E56B3F"
                strokeWidth="1.45"
                strokeLinecap="round"
              />
              <circle cx={PROBE.x1} cy={PROBE.y1} r={PROBE.coralR} fill="#E56B3F" />
              <circle
                cx={GOLD_POINT.cx}
                cy={GOLD_POINT.cy}
                r={PROBE.goldR}
                fill={GOLD}
              />
            </g>
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              KomeSomme
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 13,
                color: MUTED,
                letterSpacing: "0.06em",
              }}
            >
              {GUIDE_ROLE_ANNOTATED}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 14,
            color: MUTED,
            letterSpacing: "0.12em",
          }}
        >
          {SHARE_CARD_SLOGAN}
        </div>
      </div>

      {/* 2. Hero — left copy + right ink art */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 22,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 17,
              color: MUTED,
              letterSpacing: "0.14em",
            }}
          >
            {`${rice.prefecture} · ${rice.region}`}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              fontSize: nameSize,
              fontFamily: "Noto Serif JP",
              fontWeight: 700,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: "0.02em",
            }}
          >
            {rice.name}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              fontSize: 22,
              color: BROWN,
              letterSpacing: "0.08em",
            }}
          >
            {rice.texture_label}／{rice.sweetness_label}
          </div>
          <ScoreBars scores={scores} />
        </div>
        {heroPhotoDataUrl ? <HeroArt dataUrl={heroPhotoDataUrl} /> : null}
      </div>

      {/* 3. Full-catalog matrix (home TasteMap language) */}
      <FullCatalogMatrix rice={rice} stars={stars} hero={hero} />

      {/* 4. Footer — short URL + one-line editorial note */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 19,
              fontWeight: 700,
              color: INK,
            }}
          >
            {hostLine}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              color: MUTED,
              letterSpacing: "0.04em",
            }}
          >
            味わいは編集の目安です
          </div>
        </div>
        {qrDataUrl ? (
          <div
            style={{
              display: "flex",
              width: 92,
              height: 92,
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: "#FFFDF8",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <img
              src={qrDataUrl}
              width={84}
              height={84}
              alt=""
              style={{ display: "flex", width: 84, height: 84 }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
