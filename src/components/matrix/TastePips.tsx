/**
 * Five gold rice-grain pips for 1–5 taste scores.
 * Prefer on detail / dossier; library index stays numeric for density.
 */
export function TastePips({
  value,
  label,
  size = "md",
}: {
  value: number;
  /** Accessible name; when set, renders as a labeled row. */
  label?: string;
  size?: "sm" | "md";
}) {
  const n = Math.max(0, Math.min(5, Math.round(value)));
  const pip = size === "sm" ? "h-[6px] w-[8px]" : "h-[8px] w-[10px]";

  const dots = (
    <span className="inline-flex gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`${pip} rounded-full ${
            i < n ? "bg-[var(--km-gold)]" : "bg-[var(--km-ink)]/10"
          }`}
        />
      ))}
    </span>
  );

  if (!label) {
    return (
      <span className="inline-flex" aria-label={`${n} / 5`}>
        {dots}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1.5">
      <span className="text-[11px] text-[var(--km-muted)]">{label}</span>
      <span className="inline-flex items-center gap-2" aria-label={`${label} ${n}`}>
        {dots}
        <span className="font-serif text-sm leading-none text-[var(--km-brown)]">{n}</span>
      </span>
    </span>
  );
}
