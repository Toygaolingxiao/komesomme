"use client";

import { useId } from "react";

export type GrainEmphasis = "rest" | "runner" | "featured";

/**
 * Short-grain rice silhouette (plump middle, softly pointed ends).
 * Shared by map nodes and region legend chips.
 */
export function RiceGrainMark({
  fill,
  width,
  height,
  tilt = 0,
  emphasis = "rest",
  className = "",
}: {
  fill: string;
  width: number;
  height: number;
  tilt?: number;
  emphasis?: GrainEmphasis;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const featured = emphasis === "featured";
  const runner = emphasis === "runner";

  const stroke = featured
    ? "#e56b3f"
    : runner
      ? "#c4862a"
      : "rgba(112,69,34,0.12)";
  const strokeOpacity = featured ? 0.72 : runner ? 0.85 : 1;
  const strokeWidth = featured ? 1.45 : runner ? 1.2 : 0.65;

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox="0 0 28 18"
      className={className}
      style={{
        transform: `rotate(${tilt}deg)`,
        filter: featured
          ? "drop-shadow(0 1px 3px rgba(229,107,63,0.28))"
          : runner
            ? "drop-shadow(0 1px 2px rgba(196,134,42,0.22))"
            : "drop-shadow(0 0.5px 1px rgba(112,69,34,0.08))",
      }}
    >
      <defs>
        <radialGradient id={`km-grain-hi-${gid}`} cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fffdf8" stopOpacity="0.95" />
          <stop offset="45%" stopColor={fill} stopOpacity="1" />
          <stop
            offset="100%"
            stopColor={featured || runner ? "#d4a45c" : "#e0b878"}
            stopOpacity="0.95"
          />
        </radialGradient>
      </defs>
      {(featured || runner) && (
        <ellipse
          cx="14"
          cy="9"
          rx="13.2"
          ry="8.2"
          fill={featured ? "rgba(229,107,63,0.14)" : "rgba(212,154,42,0.12)"}
        />
      )}
      <path
        d="M1.6 9C1.6 9 4.2 2.1 14 2.1S26.4 9 26.4 9 23.8 15.9 14 15.9 1.6 9 1.6 9Z"
        fill={`url(#km-grain-hi-${gid})`}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />
      <ellipse
        cx="11.2"
        cy="7.1"
        rx="5.2"
        ry="2.4"
        fill="#fffef9"
        opacity={featured || runner ? 0.45 : 0.32}
      />
    </svg>
  );
}
