"use client";

import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { track } from "@/lib/analytics";
import {
  FOCUS,
  ICON_WEIGHT,
  appetiteLine,
  dishTags,
  type RailMatch,
} from "./shared";

export function MobileTodayCard({
  match,
  runners = [],
  loading,
  caption = "今日の一膳",
  semantic = false,
  cellNote,
  onOpen,
}: {
  match: RailMatch | null;
  runners?: RailMatch[];
  loading?: boolean;
  caption?: string;
  semantic?: boolean;
  cellNote?: string | null;
  onOpen: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  if (loading) {
    return (
      <div className="h-[9rem] animate-pulse rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)]" />
    );
  }

  if (!match) return null;

  const dishes = dishTags(match.rice).slice(0, 3);
  const intro = semantic
    ? match.reason?.trim() || appetiteLine(match.rice)
    : appetiteLine(match.rice);
  const fade = {
    duration: reduceMotion ? 0 : 0.2,
    ease: [0.23, 1, 0.32, 1] as const,
  };

  return (
    <div className="grid">
      <AnimatePresence initial={false}>
        <motion.div
          key={match.rice.id}
          className="col-start-1 row-start-1"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, pointerEvents: "none" }}
          transition={fade}
        >
    <button
      type="button"
      onClick={() => {
        track("recommendation_detail_click", { id: match.rice.id });
        onOpen(match.rice.id);
      }}
      className={`min-h-[12.5rem] w-full rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] p-4 text-left shadow-[0_16px_40px_-36px_rgba(112,69,34,0.32)] ${FOCUS}`}
    >
      <span className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
        <BrandThumb
          id={match.rice.id}
          name={match.rice.name}
          region={match.rice.region}
          prefecture={match.rice.prefecture}
          className="aspect-square w-full overflow-hidden rounded-xl"
          sizes="4.5rem"
        />
        <span className="min-w-0">
        <span className="text-[12px] font-medium tracking-wide text-[var(--km-brown)]">
          {caption}
        </span>
        <span className="mt-1.5 block font-serif text-[1.35rem] font-semibold leading-snug tracking-tight text-[var(--km-ink)]">
          {match.rice.name}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] text-[var(--km-muted)]">
          <MapPin size={12} weight={ICON_WEIGHT} className="shrink-0" />
          <span>{match.rice.prefecture}産</span>
        </span>
        </span>
      </span>

      <span className="mt-3.5 block break-words font-serif text-[14px] leading-[1.75] text-[var(--km-ink)] [overflow-wrap:anywhere]">
        {intro}
      </span>

      {dishes.length > 0 ? (
        <span className="mt-3 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
          {dishes.join("、")}
        </span>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--km-accent-ink)]">
        くわしく見る
        <ArrowRight size={13} weight={ICON_WEIGHT} />
      </span>
    </button>
        </motion.div>
      </AnimatePresence>
      {cellNote ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--km-muted)]">{cellNote}</p>
      ) : null}
      {runners.length > 0 ? (
        <ol className="mt-2 flex flex-col">
          {runners.map((row, index) => (
            <li key={row.rice.id} className="border-b border-[var(--km-border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(row.rice.id)}
                className={`flex w-full items-baseline justify-between gap-3 py-2 text-left ${FOCUS}`}
              >
                <span className="min-w-0 truncate font-serif text-[15px] text-[var(--km-ink)]">
                  <span className="mr-2 text-[12px] text-[var(--km-gold-ink)]">0{index + 2}</span>
                  {row.rice.name}
                </span>
                <span className="shrink-0 text-[12px] text-[var(--km-muted)]">{row.rice.prefecture}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
