"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
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

function polygonPath(values: number[]) {
  return (
    values
      .map((value, index) => {
        const ratio = (Math.max(1, Math.min(5, value)) - 1) / 4;
        const point = polar(index, values.length, ratio);
        return `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
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
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion() ?? false;
  const draw = reduceMotion || inView;

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
      {/* compact: always stack — row layout in a narrow column squeezes summary into 1-glyph lines */}
      <div
        className={
          compact
            ? "mt-3 flex flex-col items-start gap-3"
            : "mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-6"
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={summary}
          className="h-auto w-full max-w-[240px] shrink-0 sm:max-w-[280px]"
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
          <motion.path
            d={polygonPath(values)}
            fill="rgba(212,154,42,0.22)"
            stroke="none"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: draw ? 1 : 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              delay: reduceMotion ? 0 : 0.55,
              ease: [0.77, 0, 0.175, 1],
            }}
          />
          <motion.path
            d={polygonPath(values)}
            fill="none"
            stroke="#c4861c"
            strokeWidth={1.6}
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: draw ? 1 : 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.8,
              ease: [0.77, 0, 0.175, 1],
            }}
          />
        </svg>
        <p
          className={
            compact
              ? "w-full max-w-[36ch] text-left text-[13px] leading-relaxed text-[var(--km-ink-soft)]"
              : "mt-0 max-w-[36ch] text-[13px] leading-relaxed text-[var(--km-ink-soft)] sm:mt-6 sm:text-left"
          }
        >
          {summary}
        </p>
      </div>
    </section>
  );
}
