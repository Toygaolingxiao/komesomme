"use client";

import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import { track } from "@/lib/analytics";
import {
  FOCUS,
  affinityDisplay,
  forYouLines,
  suitabilityLine,
} from "./shared";

export function ForYou({
  rice,
  heading = "この米はこんな人に",
}: {
  rice: RiceProfileV2;
  /** Set null when a parent section already provides the title. */
  heading?: string | null;
}) {
  const lines = forYouLines(rice);
  if (lines.length === 0) return null;

  return (
    <section>
      {heading ? (
        <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
          {heading}
        </h2>
      ) : null}
      <ul
        className={`list-none space-y-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)] ${
          heading ? "mt-3" : ""
        }`}
      >
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export function SimilarRiceCards({
  neighbours,
  onSelect,
  heading = "似ている銘柄と比べる",
}: {
  neighbours: RiceMatchResult[];
  onSelect?: (id: string) => void;
  heading?: string | null;
}) {
  if (neighbours.length === 0) return null;

  const open = (id: string) => {
    track("similar_rice_click", { id });
    onSelect?.(id);
  };

  return (
    <section>
      {heading ? (
        <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
          {heading}
        </h2>
      ) : null}
      <ul className={`divide-y divide-[var(--km-border)] ${heading ? "mt-4" : ""}`}>
        {neighbours.map((neighbour) => {
          const inner = (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-serif text-[15px] font-semibold text-[var(--km-ink)]">
                  {neighbour.rice.name}
                </span>
                <span className="mt-0.5 text-[12px] text-[var(--km-muted)]">
                  {neighbour.rice.prefecture}
                  {" / "}
                  {suitabilityLine(neighbour.rice)}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-[var(--km-muted)]">
                {affinityDisplay(neighbour.score)}
              </span>
            </>
          );

          return (
            <li key={neighbour.rice.id}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => open(neighbour.rice.id)}
                  className={`flex w-full items-baseline justify-between gap-4 py-3.5 text-left transition hover:text-[var(--km-brown)] ${FOCUS}`}
                >
                  {inner}
                </button>
              ) : (
                <a
                  href={`/library/${neighbour.rice.id}`}
                  onClick={() => track("similar_rice_click", { id: neighbour.rice.id })}
                  className={`flex items-baseline justify-between gap-4 py-3.5 transition hover:text-[var(--km-brown)] ${FOCUS}`}
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
