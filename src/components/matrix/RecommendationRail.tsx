"use client";

import { AnimatePresence, motion } from "motion/react";
import type { RecommendationMode } from "@/types/rice";
import { FOCUS, type RailMatch } from "./shared";
import { RailSkeleton, SemanticReading } from "./states";

function BestMatchCard({
  match,
  active,
  onSelect,
}: {
  match: RailMatch;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-2xl border p-5 text-left transition duration-300 active:scale-[0.99] ${FOCUS} ${
        active
          ? "border-[var(--km-gold)]/45 bg-[#f1e2c5]"
          : "border-[var(--km-border)] bg-[var(--km-surface-warm)]/58 hover:border-[var(--km-gold)]/40"
      } shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_20px_48px_-34px_rgba(83,65,48,0.30)]`}
    >
      <span className="flex items-start justify-between gap-5">
        <span>
          <span className="block text-[11px] tracking-[0.12em] text-[var(--km-accent)]">
            米ソムリエの一膳
          </span>
          <span className="mt-3 block text-xl font-semibold tracking-tight text-[var(--km-ink)] transition-colors group-hover:text-[var(--km-gold)]">
            {match.rice.name}
          </span>
          <span className="mt-1 block text-xs text-[var(--km-muted)]">
            {match.rice.prefecture}・{match.rice.quadrant}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[10px] text-[var(--km-muted)]">相性</span>
          <span className="mt-1 block font-mono text-2xl tabular-nums text-[var(--km-accent)]">
            {match.score}
          </span>
        </span>
      </span>

      <span className="mt-4 block border-t border-[var(--km-border)] pt-3 text-xs leading-relaxed text-[var(--km-ink-soft)]">
        {match.reason}
      </span>

      <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--km-muted)]">
        <span>粒感 {match.rice.hardness}</span>
        <span>甘み {match.rice.sweetness}</span>
        <span>粘り {match.rice.stickiness}</span>
        <span>旨み {match.rice.umami}</span>
      </span>
    </button>
  );
}

function RunnerUpList({
  matches,
  activeId,
  reduceMotion,
  onSelect,
}: {
  matches: RailMatch[];
  activeId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium text-[var(--km-ink-soft)]">近い味わいの銘柄</p>
      <ol className="divide-y divide-[var(--km-border)]">
        {matches.map((match, index) => (
          <motion.li
            key={match.rice.id}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => onSelect(match.rice.id)}
              className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-3.5 text-left ${FOCUS}`}
            >
              <span className="font-mono text-xs text-[var(--km-muted)]">0{index + 2}</span>
              <span className="min-w-0">
                <span
                  className={`block truncate text-sm transition-colors ${
                    activeId === match.rice.id
                      ? "text-[var(--km-accent)]"
                      : "text-[var(--km-ink)] group-hover:text-[var(--km-accent)]"
                  }`}
                >
                  {match.rice.name}
                </span>
                <span className="mt-1 block truncate text-[11px] text-[var(--km-muted)]">
                  {match.reason}
                </span>
              </span>
              <span className="font-mono text-xs tabular-nums text-[var(--km-ink-soft)]">
                相性 {match.score}
              </span>
            </button>
          </motion.li>
        ))}
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
  reduceMotion,
  onSelect,
  onResetMode,
}: {
  matches: RailMatch[];
  mode: RecommendationMode;
  loading: boolean;
  pending: boolean;
  selectedId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onResetMode: () => void;
}) {
  const primary = matches[0] ?? null;
  const runnerUps = matches.slice(1);

  return (
    <div className="flex flex-1 flex-col pb-5 lg:pb-5 xl:pb-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-[var(--km-ink)]">
          米ソムリエのおすすめ
        </h3>
        {mode === "semantic" ? (
          <button
            type="button"
            onClick={onResetMode}
            className={`whitespace-nowrap rounded-full px-2 py-1 text-xs text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            座標に戻す
          </button>
        ) : null}
      </div>

      <div className="mt-5 lg:mt-4 xl:mt-5">
        {loading ? (
          <RailSkeleton />
        ) : pending ? (
          <SemanticReading reduceMotion={reduceMotion} />
        ) : matches.length === 0 ? (
          <p className="py-6 text-sm text-[var(--km-muted)]">
            該当する銘柄が見つかりませんでした。
          </p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${mode}-${primary?.rice.id ?? "empty"}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {primary ? (
                <BestMatchCard
                  match={primary}
                  active={primary.rice.id === selectedId}
                  onSelect={() => onSelect(primary.rice.id)}
                />
              ) : null}

              {runnerUps.length > 0 ? (
                <RunnerUpList
                  matches={runnerUps}
                  activeId={selectedId}
                  reduceMotion={reduceMotion}
                  onSelect={onSelect}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
