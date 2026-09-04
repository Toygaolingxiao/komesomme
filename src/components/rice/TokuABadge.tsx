import { TOKU_A_HINT, TOKU_A_LABEL } from "@/data/rice/tokuA";

export function TokuABadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title={TOKU_A_HINT}
      className={`inline-flex items-center rounded-full border border-[var(--km-gold)]/45 bg-[var(--km-surface-warm)] font-serif font-semibold tracking-wide text-[var(--km-brown)] ${
        compact ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {TOKU_A_LABEL}
    </span>
  );
}
