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

/** Mobile No.1 only — runners stay on the map so the matrix sits closer. */
export function MobileTodayCard({
  match,
  loading,
  caption = "今日の一膳",
  semantic = false,
  onOpen,
}: {
  match: RailMatch | null;
  loading?: boolean;
  caption?: string;
  semantic?: boolean;
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
            <span className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3">
              <BrandThumb
                id={match.rice.id}
                name={match.rice.name}
                region={match.rice.region}
                prefecture={match.rice.prefecture}
                className="aspect-[5/4] w-full overflow-hidden rounded-xl"
                sizes="240px"
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
    </div>
  );
}
