import {
  TOKU_A_HINT,
  TOKU_A_LABEL,
  TOKU_A_YEAR_LABEL,
  tokuARegion,
} from "@/data/rice/tokuA";

export function TokuABadge({
  id,
  compact = false,
}: {
  id?: string;
  compact?: boolean;
}) {
  const region = id ? tokuARegion(id) : null;
  const title = region
    ? `${TOKU_A_HINT}（対象：${region}）`
    : TOKU_A_HINT;
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border border-[var(--km-gold)]/45 bg-[var(--km-surface-warm)] font-serif font-semibold tracking-wide text-[var(--km-brown)] ${
        compact ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {compact
        ? TOKU_A_LABEL
        : `${TOKU_A_LABEL}（${TOKU_A_YEAR_LABEL}${region ? `・${region}` : ""}）`}
    </span>
  );
}
