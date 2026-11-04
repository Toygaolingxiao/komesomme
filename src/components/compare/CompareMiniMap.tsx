import { riceProfiles } from "@/data/rice/catalog";
import { toMapProfiles } from "@/lib/rice/mapProfile";
import { toDisplayPoints } from "@/lib/rice/matrix";
import { regionColor } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";

const W = 560;
const H = 300;
const PAD = 26;

function sx(v: number): number {
  return PAD + ((v - 1) / 4) * (W - PAD * 2);
}
function sy(v: number): number {
  return H - PAD - ((v - 1) / 4) * (H - PAD * 2);
}

/**
 * Static taste-map excerpt for a comparison page. Uses the very same
 * display points as the home taste map (decimal positions plus the
 * crowd-spreading layout), rendered in the home map's language: every
 * brand a small grain in its region colour, the two compared brands as
 * large grains. One map, one set of positions, everywhere on the site.
 */
export function CompareMiniMap({
  a,
  b,
}: {
  a: RiceProfileV2;
  b: RiceProfileV2;
}) {
  const points = toDisplayPoints(toMapProfiles(riceProfiles));
  const byId = new Map(points.map((point) => [point.id, point]));
  const pa = byId.get(a.id);
  const pb = byId.get(b.id);
  if (!pa || !pb) return null;

  const label = (x: number, y: number, dy: number) => {
    const px = sx(x);
    const fromRight = px > W - 200;
    return {
      x: fromRight ? px - 16 : px + 16,
      y: sy(y) + dy,
      anchor: fromRight ? ("end" as const) : ("start" as const),
    };
  };
  const labelA = label(pa.display_x, pa.display_y, -12);
  const labelB = label(pb.display_x, pb.display_y, 24);

  return (
    <figure className="min-w-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${a.name}と${b.name}の味わいの地図での位置`}
        className="w-full rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)]"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v} stroke="var(--km-grid)" strokeWidth="1">
            <line x1={sx(v)} y1={PAD - 8} x2={sx(v)} y2={H - PAD + 8} />
            <line x1={PAD - 8} y1={sy(v)} x2={W - PAD + 8} y2={sy(v)} />
          </g>
        ))}
        {points.map((point) =>
          point.id === a.id || point.id === b.id ? null : (
            <ellipse
              key={point.id}
              cx={sx(point.display_x)}
              cy={sy(point.display_y)}
              rx="6.5"
              ry="4"
              fill={regionColor(point.region)}
              opacity="0.45"
            />
          ),
        )}
        <ellipse
          cx={sx(pa.display_x)}
          cy={sy(pa.display_y)}
          rx="11"
          ry="7"
          fill={regionColor(a.region)}
          stroke="#FFFDF7"
          strokeWidth="2.5"
        />
        <ellipse
          cx={sx(pb.display_x)}
          cy={sy(pb.display_y)}
          rx="11"
          ry="7"
          fill={regionColor(b.region)}
          stroke="#FFFDF7"
          strokeWidth="2.5"
        />
        <text
          x={labelA.x}
          y={labelA.y}
          textAnchor={labelA.anchor}
          fontSize="13.5"
          fontWeight="700"
          fill="var(--km-ink)"
          stroke="#FFFDF7"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {a.name}
        </text>
        <text
          x={labelB.x}
          y={labelB.y}
          textAnchor={labelB.anchor}
          fontSize="13.5"
          fontWeight="700"
          fill="var(--km-ink)"
          stroke="#FFFDF7"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {b.name}
        </text>
        <text x={PAD - 6} y={16} fontSize="11" fill="var(--km-muted)">
          やわらか、ほどける ↑
        </text>
        <text x={PAD - 6} y={H - 6} fontSize="11" fill="var(--km-muted)">
          ↓ 粒立ちしっかり
        </text>
        <text
          x={W - PAD + 6}
          y={16}
          fontSize="11"
          fill="var(--km-muted)"
          textAnchor="end"
        >
          ← すっきり澄む
        </text>
        <text
          x={W - PAD + 6}
          y={H - 6}
          fontSize="11"
          fill="var(--km-muted)"
          textAnchor="end"
        >
          甘みふくらむ →
        </text>
      </svg>
    </figure>
  );
}
