"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import type { RecommendationMode } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  affinityDisplay,
  affinityLabel,
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
  const label = affinityLabel(score);

  return (
    <span
      aria-label={`${label}、味わい相性 ${shown}`}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] text-center"
    >
      <span>
        <span className="block text-[8px] leading-tight text-[var(--km-muted)]">
          {label}
        </span>
        <span className="block font-serif text-[1.05rem] leading-none text-[var(--km-brown)]">
          {shown}
        </span>
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
      className={`group relative w-full overflow-hidden rounded-2xl border p-3 text-left transition duration-300 active:scale-[0.99] ${FOCUS} ${
        active || highlighted
          ? "border-[var(--km-brown)]/25 bg-[var(--km-surface)]"
          : "border-[var(--km-border)] bg-[var(--km-surface)] hover:border-[var(--km-gold)]/35"
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: fill }}
      />

      <span className="relative pl-2">
        <span className="text-[11px] font-medium text-[var(--km-brown)]">
          今日の一膳
        </span>
        <span className="mt-1 block font-serif text-[19px] font-semibold leading-tight tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
          {match.rice.name}
        </span>
        <span className="mt-1.5 line-clamp-2 block break-words text-[12px] leading-relaxed text-[var(--km-ink)] [overflow-wrap:anywhere]">
          {benefit}
        </span>
      </span>

      <span className="relative mt-2 flex items-end justify-between gap-3 pl-2">
        <span className="flex items-center gap-1 text-xs text-[var(--km-muted)]">
          <MapPin size={12} weight={ICON_WEIGHT} />
          {match.rice.prefecture}産
        </span>
        <AffinitySeal score={match.score} />
      </span>

      {dishes.length > 0 ? (
        <span className="relative mt-2 block pl-2 text-[11px] leading-snug text-[var(--km-ink-soft)]">
          {dishes.slice(0, 3).join("、")}
        </span>
      ) : null}

      <span className="relative mt-2 inline-flex items-center gap-1 pl-2 text-[11px] text-[var(--km-accent)]">
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
                className={`group grid w-full grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:-translate-y-px hover:border-[var(--km-border)] hover:bg-[var(--km-surface)] hover:shadow-[0_6px_14px_rgba(112,69,34,0.08)] ${FOCUS} ${
                  activeId === match.rice.id || highlightId === match.rice.id
                    ? "border-[var(--km-border)] bg-[var(--km-surface)]"
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
                <span className="text-right">
                  <span className="block text-[9px] text-[var(--km-muted)]">
                    {affinityLabel(match.score)}
                  </span>
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
