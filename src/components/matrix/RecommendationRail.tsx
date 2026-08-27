"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BowlFood, MapPin, Sparkle } from "@phosphor-icons/react";
import type { RecommendationMode } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  TAG_TONES,
  dishTags,
  pairTasteTags,
  regionColor,
  tastingSentence,
  type RailMatch,
} from "./shared";
import { RailSkeleton, SemanticReading } from "./states";

function TastePills({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((tag, index) => {
        const tone = TAG_TONES[index % TAG_TONES.length];
        return (
          <span
            key={tag}
            className="rounded-md px-1.5 py-0.5 text-[9px] leading-tight"
            style={{
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              color: tone.text,
            }}
          >
            {tag}
          </span>
        );
      })}
    </span>
  );
}

function AffinitySeal({ score }: { score: number }) {
  return (
    <span
      aria-label={`今日の相性 ${score}`}
      className="relative grid h-[3.6rem] w-[3.6rem] shrink-0 place-items-center rounded-full bg-[var(--km-surface-warm)] text-center"
      style={{
        boxShadow:
          "0 0 0 2px #d49a2a, 0 0 0 5px #fff5e5, 0 0 0 6px rgba(212,154,42,0.55), 0 8px 16px rgba(212,154,42,0.22)",
      }}
    >
      <span>
        <span className="block text-[8px] tracking-wide text-[var(--km-muted)]">
          今日の相性
        </span>
        <span className="mt-0.5 block font-serif text-[1.35rem] leading-none text-[var(--km-brown)]">
          {score}
        </span>
      </span>
    </span>
  );
}

function BestMatchCard({
  match,
  active,
  coordinateMode,
  onSelect,
}: {
  match: RailMatch;
  active: boolean;
  coordinateMode: boolean;
  onSelect: () => void;
}) {
  const fill = match.rice.region_color ?? regionColor(match.rice.region);
  const dishes = dishTags(match.rice);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-2xl border p-3.5 text-left transition duration-300 active:scale-[0.99] ${FOCUS} ${
        active
          ? "border-[var(--km-accent)]/40 bg-[var(--km-surface)]"
          : "border-[var(--km-border)] bg-[var(--km-surface)] hover:border-[var(--km-gold)]/40"
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: fill }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-35"
        style={{
          background: `radial-gradient(circle, ${fill} 0%, transparent 70%)`,
        }}
      />

      <span className="relative flex items-start justify-between gap-3 pl-2">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-[var(--km-accent)]">
            <Sparkle size={13} weight="fill" />
            米ソムリエの一押
          </span>
          <span className="mt-1 block font-serif text-[19px] font-semibold leading-tight tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
            {match.rice.name}
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-[var(--km-muted)]">
            <MapPin size={12} weight={ICON_WEIGHT} />
            {match.rice.prefecture}産
          </span>
        </span>
        <AffinitySeal score={match.score} />
      </span>

      <span className="relative mt-2.5 block pl-2">
        {coordinateMode ? (
          <span className="mb-1 block text-[11px] leading-relaxed text-[var(--km-brown)]">
            選んだ味わいに寄り添う、今日の一膳。
          </span>
        ) : null}
        <span className="line-clamp-3 text-[12px] leading-relaxed text-[var(--km-ink-soft)]">
          {tastingSentence(match.rice, match.reason)}
        </span>
      </span>

      {dishes.length > 0 ? (
        <span className="relative mt-2.5 block pl-2">
          <span className="text-[10px] text-[var(--km-muted)]">今日の食卓なら</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {dishes.slice(0, 3).map((dish) => (
              <span
                key={dish}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--km-surface-warm)] px-1.5 py-0.5 text-[9px] text-[var(--km-brown)]"
              >
                <BowlFood size={10} weight={ICON_WEIGHT} />
                {dish}
              </span>
            ))}
          </span>
        </span>
      ) : null}

      <span className="relative mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 pl-2 text-[10px] text-[var(--km-muted)]">
        <span>粒感 {match.rice.hardness}</span>
        <span>甘み {match.rice.sweetness}</span>
        <span>粘り {match.rice.stickiness}</span>
        <span>旨み {match.rice.umami}</span>
      </span>

      <span className="relative mt-2.5 inline-flex items-center gap-1 pl-2 text-[11px] text-[var(--km-accent)]">
        詳しく見る
        <ArrowRight size={12} weight={ICON_WEIGHT} />
      </span>
    </button>
  );
}

function RunnerUpList({
  matches,
  activeId,
  reduceMotion,
  onSelect,
  onHover,
}: {
  matches: RailMatch[];
  activeId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        近い味わいの銘柄
      </p>
      <ol className="flex flex-col gap-1.5">
        {matches.map((match, index) => {
          const fill = match.rice.region_color ?? regionColor(match.rice.region);
          const tags = pairTasteTags(match.rice);

          return (
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
                className={`group grid w-full grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-left transition hover:-translate-y-px hover:border-[var(--km-border)] hover:bg-[var(--km-surface)] hover:shadow-[0_6px_14px_rgba(112,69,34,0.08)] ${FOCUS} ${
                  activeId === match.rice.id ? "border-[var(--km-border)] bg-[var(--km-surface)]" : ""
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
                  <TastePills tags={tags} />
                </span>
                <span className="text-right">
                  <span className="block text-[9px] text-[var(--km-muted)]">相性</span>
                  <span className="font-serif text-sm text-[var(--km-brown)]">{match.score}</span>
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
  reply,
  mode,
  loading,
  pending,
  selectedId,
  reduceMotion,
  onSelect,
  onHover,
  onResetMode,
}: {
  matches: RailMatch[];
  reply?: string | null;
  mode: RecommendationMode;
  loading: boolean;
  pending: boolean;
  selectedId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  onResetMode: () => void;
}) {
  const primary = matches[0] ?? null;
  const runnerUps = matches.slice(1);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-3">
      <div className="flex items-baseline justify-end">
        {mode === "semantic" ? (
          <button
            type="button"
            onClick={onResetMode}
            className={`whitespace-nowrap rounded-full px-2 py-1 text-xs text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            地図で選び直す
          </button>
        ) : null}
      </div>
      {mode === "semantic" ? (
        <p className="mb-2 text-[11px] leading-relaxed text-[var(--km-muted)]">
          探針は1位の銘柄の位置です。地図を動かすと、近い味わいに戻ります。
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
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
              {reply ? (
                <p className="mb-3 line-clamp-3 text-[12px] leading-relaxed text-[var(--km-ink-soft)]">
                  {reply}
                </p>
              ) : null}

              {primary ? (
                <BestMatchCard
                  match={primary}
                  active={primary.rice.id === selectedId}
                  coordinateMode={mode === "coordinate"}
                  onSelect={() => onSelect(primary.rice.id)}
                />
              ) : null}

              {runnerUps.length > 0 ? (
                <RunnerUpList
                  matches={runnerUps}
                  activeId={selectedId}
                  reduceMotion={reduceMotion}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
