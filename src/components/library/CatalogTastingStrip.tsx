import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";
import type { RiceProfileV2 } from "@/types/rice";

function TastePips({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--km-muted)]">
      <span>{label}</span>
      <span className="inline-flex gap-0.5" aria-label={`${label} ${value}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < value ? "bg-[var(--km-gold)]" : "bg-[var(--km-border)]"
            }`}
          />
        ))}
      </span>
    </span>
  );
}

/**
 * Catalogue tasting layer inside the encyclopedia page.
 * Scores and sommelier copy stay canonical on the profile; this does not rewrite them.
 */
export function CatalogTastingStrip({ rice }: { rice: RiceProfileV2 }) {
  const dishes = rice.best_match_dishes.filter(Boolean).slice(0, 4);

  return (
    <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-5 py-5 sm:px-7">
      <p className="text-[11px] tracking-[0.12em] text-[var(--km-accent)]">
        米ソムリエの品鑑
      </p>
      {rice.sommelier_note ? (
        <p className="mt-3 font-serif text-[14px] leading-[1.9] text-[var(--km-ink)]">
          {rice.sommelier_note}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        <TastePips label="甘み" value={rice.sweetness} />
        <TastePips label="粒感" value={rice.hardness} />
        <TastePips label="粘り" value={rice.stickiness} />
      </div>
      {dishes.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {dishes.map((dish) => (
            <li
              key={dish}
              className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-1 text-[11px] text-[var(--km-brown)]"
            >
              {dish}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        href={`/${rice.id}`}
        className={`mt-4 inline-flex text-[12px] text-[var(--km-ink-soft)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
      >
        品鑑ページで相性・季節・酒を見る
      </Link>
    </section>
  );
}
