"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { track } from "@/lib/analytics";
import type { RecommendationMode } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  appetiteLine,
  dishTags,
  regionColor,
  suitabilityLine,
  type RailMatch,
} from "./shared";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { RailSkeleton, SemanticReading } from "./states";

function BestMatchCard({
  match,
  active,
  highlighted,
  semantic,
  caption,
  onSelect,
  onHover,
}: {
  match: RailMatch;
  active: boolean;
  highlighted: boolean;
  semantic: boolean;
  caption: string;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const fill = match.rice.region_color ?? regionColor(match.rice.region);
  const dishes = dishTags(match.rice);
  const benefit = semantic ? match.reason : appetiteLine(match.rice);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover?.(match.rice.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(match.rice.id)}
      onBlur={() => onHover?.(null)}
      className={`group relative w-full overflow-hidden rounded-xl border-l-[3px] bg-[var(--km-surface)]/90 py-3 pl-3.5 pr-3 text-left transition duration-200 active:scale-[0.99] ${FOCUS} ${
        active || highlighted
          ? "bg-[var(--km-surface)] shadow-[inset_0_0_0_1px_rgba(112,69,34,0.12)]"
          : "hover:bg-[var(--km-surface)]"
      }`}
      style={{ borderLeftColor: fill }}
    >
      <span className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
        <BrandThumb
          id={match.rice.id}
          name={match.rice.name}
          region={match.rice.region}
          prefecture={match.rice.prefecture}
          className="aspect-square w-full overflow-hidden rounded-lg"
          sizes="3.25rem"
        />
        <span className="min-w-0">
        <span className="text-[12px] font-medium tracking-wide text-[var(--km-brown)]">
          {caption}
        </span>
        <span className="mt-1.5 block font-serif text-[1.25rem] font-semibold leading-tight tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
          {match.rice.name}
        </span>
        <span className="mt-2 line-clamp-2 block break-words text-[13px] leading-relaxed text-[var(--km-ink-soft)] [overflow-wrap:anywhere]">
          {benefit}
        </span>
        </span>
      </span>

      <span className="relative mt-3 flex items-center gap-1 text-[12px] text-[var(--km-muted)]">
        <MapPin size={12} weight={ICON_WEIGHT} />
        {match.rice.prefecture}産
      </span>

      {dishes.length > 0 ? (
        <span className="relative mt-2.5 block text-[12px] leading-snug text-[var(--km-muted)]">
          {dishes.slice(0, 3).join("、")}
        </span>
      ) : null}

      <span className="relative mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--km-accent-ink)]">
        くわしく見る
        <ArrowRight size={12} weight={ICON_WEIGHT} />
      </span>
    </button>
  );
}

function RunnerUpList({
  matches,
  activeId,
  highlightId,
  reduceMotion,
  semantic,
  onSelect,
  onHover,
}: {
  matches: RailMatch[];
  activeId: string | null;
  highlightId?: string | null;
  reduceMotion: boolean;
  semantic: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div className="mt-2.5">
      <p className="mb-1 font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        {semantic ? "この相談のほかの銘柄" : "近い味わいの銘柄"}
      </p>
      <ol className="flex flex-col gap-1">
        {matches.map((match, index) => {
          const fill = match.rice.region_color ?? regionColor(match.rice.region);

          return (
            <motion.li
              key={match.rice.id}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              <button
                type="button"
                onClick={() => onSelect(match.rice.id)}
                className={`group grid w-full grid-cols-[1.4rem_minmax(0,1fr)] items-center gap-2 rounded-lg px-1.5 py-2 text-left transition hover:bg-[var(--km-surface)]/80 ${FOCUS} ${
                  activeId === match.rice.id || highlightId === match.rice.id
                    ? "bg-[var(--km-surface)]"
                    : ""
                }`}
                onMouseEnter={() => onHover?.(match.rice.id)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(match.rice.id)}
                onBlur={() => onHover?.(null)}
              >
                <span className="font-serif text-[12px] text-[var(--km-gold-ink)]">0{index + 2}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: fill }}
                    />
                    <span
                      className={`truncate text-sm ${
                        activeId === match.rice.id
                          ? "text-[var(--km-brown)]"
                          : "text-[var(--km-ink)]"
                      }`}
                    >
                      {match.rice.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-[var(--km-muted)]">
                    {match.rice.prefecture}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
                    {semantic
                      ? match.reason
                      : suitabilityLine(match.rice)}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The recommendation rail.
 *
 * No.1 is a prominent card and No.2-4 a quiet list, so the hierarchy reads without
 * needing to compare numbers.
 */
export function RecommendationRail({
  matches,
  mode,
  loading,
  pending,
  selectedId,
  highlightId = null,
  reduceMotion,
  caption,
  cellNote,
  onSelect,
  onHover,
}: {
  matches: RailMatch[];
  mode: RecommendationMode;
  loading: boolean;
  pending: boolean;
  selectedId: string | null;
  highlightId?: string | null;
  reduceMotion: boolean;
  caption: string;
  cellNote?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const primary = matches[0] ?? null;
  const runnerUps = matches.slice(1);
  const signature = `${mode}:${matches.map((match) => match.rice.id).join(",")}`;
  const fade = {
    duration: reduceMotion ? 0 : 0.22,
    ease: [0.23, 1, 0.32, 1] as const,
  };

  const open = (id: string) => {
    track("recommendation_detail_click", { id });
    onSelect(id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <RailSkeleton reduceMotion={reduceMotion} />
        ) : pending ? (
          <SemanticReading reduceMotion={reduceMotion} />
        ) : matches.length === 0 ? (
          <p className="py-6 text-sm text-[var(--km-muted)]">
            該当する銘柄が見つかりませんでした。
          </p>
        ) : (
          <div className="grid">
            <AnimatePresence initial={false}>
              <motion.div
                key={signature}
                className="col-start-1 row-start-1"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, pointerEvents: "none" }
                }
                transition={fade}
              >
              {primary ? (
                <>
                  <BestMatchCard
                    match={primary}
                    active={primary.rice.id === selectedId}
                    highlighted={primary.rice.id === highlightId}
                    semantic={mode === "semantic"}
                    caption={caption}
                    onSelect={() => open(primary.rice.id)}
                    onHover={onHover}
                  />
                  {cellNote ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--km-muted)]">{cellNote}</p>
                  ) : null}
                  {runnerUps.length > 0 ? (
                    <RunnerUpList
                      matches={runnerUps}
                      activeId={selectedId}
                      highlightId={highlightId}
                      reduceMotion={reduceMotion}
                      semantic={mode === "semantic"}
                      onSelect={open}
                      onHover={onHover}
                    />
                  ) : null}
                </>
              ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      {!loading && !pending && primary ? (
        <ShopLinksStrip
          rice={primary.rice}
          variant="compact"
          expandMode="disclosure"
          disclosure="pr"
          className="mt-2 shrink-0 border-t border-[var(--km-border)]/70 pt-2"
        />
      ) : null}
    </div>
  );
}
