"use client";

import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import { track } from "@/lib/analytics";
import {
  FOCUS,
  affinityDisplay,
  affinityLabel,
  forYouLines,
  suitabilityLine,
} from "./shared";

export function ForYou({ rice }: { rice: RiceProfileV2 }) {
  const lines = forYouLines(rice);
  if (lines.length === 0) return null;

  return (
    <section>
      <h2 className="font-serif text-[15px] font-semibold text-[var(--km-ink)] sm:text-lg">
        この米はこんな人に
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--km-gold)]" />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SimilarRiceCards({
  neighbours,
  onSelect,
}: {
  neighbours: RiceMatchResult[];
  onSelect?: (id: string) => void;
}) {
  if (neighbours.length === 0) return null;

  const open = (id: string) => {
    track("similar_rice_click", { id });
    onSelect?.(id);
  };

  return (
    <section>
      <h2 className="font-serif text-[15px] font-semibold text-[var(--km-ink)] sm:text-lg">
        似ている銘柄と比べる
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {neighbours.map((neighbour) => {
          const inner = (
            <>
              <span className="block truncate font-serif text-[15px] font-semibold text-[var(--km-ink)]">
                {neighbour.rice.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--km-muted)]">
                {neighbour.rice.prefecture}
              </span>
              <span className="mt-1.5 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
                {suitabilityLine(neighbour.rice)}
              </span>
              <span className="mt-2 block text-[10px] text-[var(--km-muted)]">
                {affinityLabel(neighbour.score)} {affinityDisplay(neighbour.score)}
              </span>
            </>
          );

          return (
            <li key={neighbour.rice.id}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => open(neighbour.rice.id)}
                  className={`w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 px-3 py-2.5 text-left transition hover:border-[var(--km-gold)]/40 ${FOCUS}`}
                >
                  {inner}
                </button>
              ) : (
                <a
                  href={`/${neighbour.rice.id}`}
                  onClick={() => track("similar_rice_click", { id: neighbour.rice.id })}
                  className={`block rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 px-3 py-2.5 transition hover:border-[var(--km-gold)]/40 ${FOCUS}`}
                >
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
