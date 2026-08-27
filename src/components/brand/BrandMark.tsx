import {
  BRAND,
  CONTOUR_PATHS,
  FAVICON_POINT,
  GOLD_POINT,
  GRAIN_PATH,
  ORBIT_PATH,
  PROBE,
} from "./markGeometry";

export type BrandMarkVariant = "favicon" | "standard";
export type BrandMarkTone = "color" | "mono" | "inverse";

/**
 * KomeSomme mark, matching the grain + tasting-probe system board.
 *
 * favicon  — cream-friendly outline grain + gold point
 * standard — outline, contours, orbit, coral probe, gold tasting point
 */
export function BrandMark({
  variant = "standard",
  tone = "color",
  badge = "none",
  title = "KomeSomme",
  className,
}: {
  variant?: BrandMarkVariant;
  tone?: BrandMarkTone;
  badge?: "none" | "light";
  title?: string;
  className?: string;
}) {
  const ink = tone === "inverse" ? BRAND.riceWhite : BRAND.charcoal;
  const gold = tone === "mono" ? ink : BRAND.gold;
  const coral = tone === "mono" ? ink : BRAND.coral;
  const compact = variant === "favicon";
  const padded = badge !== "none";

  const mark = (
    <>
      <path
        d={GRAIN_PATH}
        fill="none"
        stroke={ink}
        strokeWidth={compact ? 2.6 : 1.85}
        strokeLinejoin="round"
      />

      {!compact
        ? CONTOUR_PATHS.map((d) => (
            <path
              key={d}
              d={d}
              stroke={gold}
              strokeWidth={0.85}
              strokeLinecap="round"
              opacity={tone === "mono" ? 0.45 : 0.7}
            />
          ))
        : null}

      <path
        d={ORBIT_PATH}
        stroke={ink}
        strokeWidth={compact ? 1.8 : 1.2}
        strokeLinecap="round"
      />

      {!compact ? (
        <>
          <line
            x1={PROBE.x1}
            y1={PROBE.y1}
            x2={PROBE.x2}
            y2={PROBE.y2}
            stroke={coral}
            strokeWidth={1.45}
            strokeLinecap="round"
          />
          <circle cx={PROBE.x1} cy={PROBE.y1} r={PROBE.coralR} fill={coral} />
        </>
      ) : null}

      <circle
        cx={compact ? FAVICON_POINT.cx : GOLD_POINT.cx}
        cy={compact ? FAVICON_POINT.cy : GOLD_POINT.cy}
        r={compact ? FAVICON_POINT.r : PROBE.goldR}
        fill={gold}
      />
    </>
  );

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      {badge === "light" ? (
        <circle
          cx="32"
          cy="32"
          r="31"
          fill={BRAND.riceWhite}
          stroke="rgba(112,69,34,0.16)"
          strokeWidth="1.15"
        />
      ) : null}
      {padded ? <g transform="translate(7.5 7) scale(0.77)">{mark}</g> : mark}
    </svg>
  );
}

export function BrandLockup({
  subtitle,
  tone = "color",
}: {
  subtitle?: string;
  tone?: BrandMarkTone;
}) {
  const ink = tone === "inverse" ? "text-[var(--km-surface)]" : "text-[var(--km-ink)]";
  const muted =
    tone === "inverse" ? "text-[var(--km-surface)]/70" : "text-[var(--km-muted)]";

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <BrandMark
        variant="standard"
        tone={tone === "inverse" ? "color" : tone}
        badge="light"
        className="h-8 w-8 shrink-0"
      />
      <span className="min-w-0">
        <span
          className={`block font-serif text-[15px] font-semibold leading-none tracking-tight ${ink}`}
        >
          KomeSomme
        </span>
        {subtitle ? (
          <span className={`mt-0.5 block truncate text-[10px] leading-snug ${muted}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
