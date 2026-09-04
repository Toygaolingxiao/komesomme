"use client";

export type GrainEmphasis = "rest" | "runner" | "featured";

function safeId(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "g";
}

/**
 * Cooked short-grain mark: plump oval, one belly shine. No germ cap, no crease.
 * Gradient ids come from `markId` so SSR and the client stay aligned (no useId).
 */
export function RiceGrainMark({
  fill,
  width,
  height,
  tilt = 0,
  emphasis = "rest",
  markId,
  className = "",
}: {
  fill: string;
  width: number;
  height: number;
  tilt?: number;
  emphasis?: GrainEmphasis;
  markId: string;
  className?: string;
}) {
  const gid = safeId(markId);
  const featured = emphasis === "featured";
  const runner = emphasis === "runner";

  const glow = featured
    ? "drop-shadow(0 0 10px rgba(229,107,63,0.55)) drop-shadow(0 1px 3px rgba(229,107,63,0.35))"
    : runner
      ? "drop-shadow(0 0 7px rgba(212,154,42,0.48)) drop-shadow(0 1px 2px rgba(168,110,28,0.28))"
      : "drop-shadow(0 1px 1px rgba(112,69,34,0.12))";

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox="0 0 40 22"
      className={className}
      style={{
        transform: `rotate(${tilt}deg)`,
        overflow: "visible",
        filter: glow,
      }}
    >
      <defs>
        <radialGradient id={`km-g-body-${gid}`} cx="40%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="42%" stopColor={fill} />
          <stop offset="100%" stopColor={fill} stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <ellipse cx="20" cy="18.6" rx="12" ry="2.2" fill="rgba(112,69,34,0.1)" />

      <path
        d="M4.8 11C4.8 6.6 11.2 3.6 20 3.6C28.8 3.6 35.2 6.6 35.2 11C35.2 15.4 28.8 18.4 20 18.4C11.2 18.4 4.8 15.4 4.8 11Z"
        fill={`url(#km-g-body-${gid})`}
        stroke="rgba(112,69,34,0.14)"
        strokeWidth="0.5"
      />
      <ellipse cx="16.5" cy="8.2" rx="7.4" ry="3" fill="#fffef9" opacity="0.38" />
    </svg>
  );
}
