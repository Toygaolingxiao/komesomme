"use client";

import { Warning } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { ICON_WEIGHT, LAYER } from "./shared";

export function MatrixSkeleton() {
  const seeds: Array<[number, number]> = [
    [26, 32],
    [44, 60],
    [63, 27],
    [72, 66],
    [35, 74],
    [54, 46],
    [81, 50],
    [19, 56],
  ];

  return (
    <div
      role="status"
      aria-label="銘柄を読み込んでいます"
      className="absolute inset-0"
      style={{ zIndex: LAYER.node }}
    >
      {seeds.map(([left, top], index) => (
        <span
          key={`${left}-${top}`}
          aria-hidden
          className="absolute h-3 w-2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-[60%_40%_55%_45%] bg-[var(--km-ink)]/12"
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 120}ms` }}
        />
      ))}
      <p className="absolute inset-x-0 bottom-8 text-center text-xs text-[var(--km-muted)]">
        銘柄を読み込んでいます
      </p>
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 border-y border-[var(--km-border)] py-6"
    >
      <span className="h-3 w-2 animate-pulse rounded-[60%_40%_55%_45%] bg-[var(--km-accent)]/55" />
      <p className="text-sm text-[var(--km-muted)]">銘柄を読み込んでいます</p>
    </div>
  );
}

export function SemanticReading({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-center gap-3 border-y border-[var(--km-border)] py-6">
      <motion.span
        className="h-3 w-2 rounded-[55%_45%_50%_50%] bg-[var(--km-accent)]/70"
        animate={
          reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.9, 1.08, 0.9] }
        }
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="text-sm text-[var(--km-ink-soft)]">料理に合う一膳を探しています</p>
    </div>
  );
}

export function EmptyPanel() {
  return (
    <div className="absolute inset-0 grid place-items-center px-8 text-center">
      <div>
        <p className="text-sm text-[var(--km-ink)]">まだ銘柄が登録されていません。</p>
        <p className="mt-2 text-xs text-[var(--km-muted)]">
          味わいの地図に表示するお米を追加してください。
        </p>
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="relative px-6 pb-12 pt-8 md:px-10">
      <div className="border-y border-rose-700/15 py-7">
        <p className="flex items-center gap-2 text-sm text-rose-800">
          <Warning size={15} weight={ICON_WEIGHT} />
          銘柄を読み込めませんでした。
        </p>
        <p className="mt-2.5 max-w-[46ch] text-xs leading-relaxed text-rose-700/80">
          時間をおいてもう一度お試しください。
        </p>
        {process.env.NODE_ENV === "development" && message ? (
          <p className="mt-2 max-w-[46ch] font-mono text-[10px] leading-relaxed text-rose-700/60">
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center whitespace-nowrap rounded-full border border-rose-700/30 px-4 py-2 text-sm text-rose-800 transition hover:bg-rose-700/5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}
