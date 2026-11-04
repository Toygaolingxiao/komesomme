import { riceProfiles } from "@/data/rice/catalog";
import { toMapProfiles } from "@/lib/rice/mapProfile";
import { calculateMatrixDisplayPoint } from "@/lib/rice/matrix";
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
 * Static taste-map excerpt for a comparison page: every brand faint, the two
 * compared brands highlighted at their raw taste coordinates
 * (calculateMatrixDisplayPoint WITHOUT the home map's crowd-spreading
 * separation — here the map is evidence, so neighbours in the data must
 * stay neighbours on the page). If the two would overlap, they are nudged
 * apart slightly on x; the page copy discloses that where it applies.
 */
export function CompareMiniMap({
  a,
  b,
}: {
  a: RiceProfileV2;
  b: RiceProfileV2;
}) {
  const points = toMapProfiles(riceProfiles).map((profile) =>
    calculateMatrixDisplayPoint(profile),
  );
  const byId = new Map(points.map((point) => [point.id, point]));
  const rawA = byId.get(a.id);
  const rawB = byId.get(b.id);
  if (!rawA || !rawB) return null;
  const pa = { ...rawA };
  const pb = { ...rawB };
  if (
    Math.abs(pa.display_x - pb.display_x) < 0.3 &&
    Math.abs(pa.display_y - pb.display_y) < 0.3
  ) {
    pa.display_x = Math.max(1, pa.display_x - 0.15);
    pb.display_x = Math.min(5, pb.display_x + 0.15);
  }

  const labelA = {
    x: Math.min(sx(pa.display_x) + 14, W - 120),
    y: sy(pa.display_y) - 10,
  };
  const labelB = {
    x: Math.min(sx(pb.display_x) + 14, W - 140),
    y: sy(pb.display_y) + 22,
  };

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
            <circle
              key={point.id}
              cx={sx(point.display_x)}
              cy={sy(point.display_y)}
              r="3"
              fill="var(--km-brown)"
              opacity="0.16"
            />
          ),
        )}
        <circle
          cx={sx(pa.display_x)}
          cy={sy(pa.display_y)}
          r="8"
          fill={regionColor(a.region)}
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx={sx(pb.display_x)}
          cy={sy(pb.display_y)}
          r="8"
          fill={regionColor(b.region)}
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x={labelA.x}
          y={labelA.y}
          fontSize="13"
          fontWeight="600"
          fill="var(--km-ink)"
        >
          {a.name}
        </text>
        <text
          x={labelB.x}
          y={labelB.y}
          fontSize="13"
          fontWeight="600"
          fill="var(--km-ink)"
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
