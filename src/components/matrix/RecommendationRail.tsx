"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import type { RecommendationMode } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  affinityDisplay,
  appetiteLine,
  dishTags,
  regionColor,
  suitabilityLine,
  type RailMatch,
} from "./shared";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { RailSkeleton, SemanticReading } from "./states";

function AffinitySeal({ score }: { score: number }) {
  const shown = affinityDisplay(score);

  return (
    <span aria-label={`味わい相性 ${shown}`} className="relative shrink-0 text-right">
      <span className="block font-serif text-[1.35rem] leading-none text-[var(--km-brown)]">
        {shown}
      </span>
    </span>
  );
}

function BestMatchCard({
  match,
  active,
  highlighted,
  semantic,
  onSelect,
  onHover,
}: {
  match: RailMatch;
  active: boolean;
  highlighted: boolean;
  semantic: boolean;
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
      className={`group relative w-full overflow-hidden rounded-xl border-l-[3px] bg-[var(--km-surface)]/90 py-3 pl-3.5 pr-3 text-left transition duration-300 active:scale-[0.99] ${FOCUS} ${
        active || highlighted
          ? "bg-[var(--km-surface)] shadow-[inset_0_0_0_1px_rgba(112,69,34,0.12)]"
          : "hover:bg-[var(--km-surface)]"
      }`}
      style={{ borderLeftColor: fill }}
    >
      <span className="relative">
        <span className="text-[11px] font-medium tracking-wide text-[var(--km-brown)]">
          今日の一膳
        </span>
        <span className="mt-1.5 block font-serif text-[1.25rem] font-semibold leading-tight tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
          {match.rice.name}
        </span>
        <span className="mt-2 line-clamp-2 block break-words text-[12.5px] leading-relaxed text-[var(--km-ink-soft)] [overflow-wrap:anywhere]">
          {benefit}
        </span>
      </span>

      <span className="relative mt-3 flex items-end justify-between gap-3">
        <span className="flex items-center gap-1 text-[11px] text-[var(--km-muted)]">
          <MapPin size={12} weight={ICON_WEIGHT} />
          {match.rice.prefecture}産
        </span>
        <AffinitySeal score={match.score} />
      </span>

      {dishes.length > 0 ? (
        <span className="relative mt-2.5 block text-[11px] leading-snug text-[var(--km-muted)]">
          {dishes.slice(0, 3).join("、")}
        </span>
      ) : null}

      <span className="relative mt-3 inline-flex items-center gap-1 text-[11px] text-[var(--km-accent)]">
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
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                onClick={() => onSelect(match.rice.id)}
                className={`group grid w-full grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-2 text-left transition hover:bg-[var(--km-surface)]/80 ${FOCUS} ${
                  activeId === match.rice.id || highlightId === match.rice.id
                    ? "bg-[var(--km-surface)]"
                    : ""
                }`}
                onMouseEnter={() => onHover?.(match.rice.id)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(match.rice.id)}
                onBlur={() => onHover?.(null)}
              >
                <span className="font-serif text-xs text-[var(--km-gold)]">0{index + 2}</span>
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
                  <span className="mt-0.5 block truncate text-[10px] text-[var(--km-muted)]">
                    {match.rice.prefecture}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-[10px] leading-snug text-[var(--km-ink-soft)]">
                    {semantic
                      ? match.reason
                      : suitabilityLine(match.rice)}
                  </span>
                </span>
                <span aria-label={`味わい相性 ${affinityDisplay(match.score)}`} className="text-right">
                  <span className="font-serif text-sm text-[var(--km-brown)]">
                    {affinityDisplay(match.score)}
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
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const primary = matches[0] ?? null;
  const runnerUps = matches.slice(1);

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
          <AnimatePresence initial={false}>
            <motion.div
              key={`${mode}-${primary?.rice.id ?? "empty"}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              {primary ? (
                <>
                  <BestMatchCard
                    match={primary}
                    active={primary.rice.id === selectedId}
                    highlighted={primary.rice.id === highlightId}
                    semantic={mode === "semantic"}
                    onSelect={() => open(primary.rice.id)}
                    onHover={onHover}
                  />
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
