import type { RiceProfileV2 } from "@/types/rice";
import { contourAxes, contourSummary } from "./shared";

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 96;
const LEVELS = [0.2, 0.4, 0.6, 0.8, 1];

function polar(index: number, total: number, ratio: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return {
    x: CX + Math.cos(angle) * RADIUS * ratio,
    y: CY + Math.sin(angle) * RADIUS * ratio,
  };
}

function polygon(values: number[]) {
  return values
    .map((value, index) => {
      const ratio = (Math.max(1, Math.min(5, value)) - 1) / 4;
      const point = polar(index, values.length, ratio);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Mid-page tasting silhouette. Not a dashboard chart.
 */
export function TasteContour({
  rice,
  compact = false,
}: {
  rice: RiceProfileV2;
  compact?: boolean;
}) {
  const axes = contourAxes(rice);
  const values = axes.map((axis) => axis.value);
  const summary = contourSummary(rice);
  const Heading = compact ? "h4" : "h2";

  return (
    <section>
      <Heading
        className={
          compact
            ? "font-serif text-[15px] font-semibold text-[var(--km-ink)]"
            : "font-serif text-lg font-semibold text-[var(--km-ink)]"
        }
      >
        味わいの輪郭
      </Heading>
      <div className="mt-3 flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={summary}
          className="h-auto w-full max-w-[280px] shrink-0"
        >
          {LEVELS.map((level) => (
            <polygon
              key={level}
              fill="none"
              stroke="rgba(112,69,34,0.12)"
              strokeWidth={level === 1 ? 1.2 : 0.8}
              points={axes
                .map((_, index) => {
                  const point = polar(index, axes.length, level);
                  return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
                })
                .join(" ")}
            />
          ))}
          {axes.map((axis, index) => {
            const end = polar(index, axes.length, 1);
            const label = polar(index, axes.length, 1.22);
            return (
              <g key={axis.label}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(112,69,34,0.18)"
                  strokeWidth={1}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#5c4e40"
                  fontSize="12"
                  fontFamily="var(--font-serif), serif"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}
          <polygon
            points={polygon(values)}
            fill="rgba(212,154,42,0.22)"
            stroke="#c4861c"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-3 max-w-[36ch] text-[13px] leading-relaxed text-[var(--km-ink-soft)] sm:mt-6">
          {summary}
        </p>
      </div>
    </section>
  );
}
