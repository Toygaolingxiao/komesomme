"use client";

import { Warning } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { GUIDE_ROLE } from "@/lib/brand/guideRole";
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
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--km-ink)]/14"
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 120}ms` }}
        />
      ))}
      <p className="absolute inset-x-0 bottom-8 text-center text-xs text-[var(--km-muted)]">
        銘柄を読み込んでいます
      </p>
    </div>
  );
}

export function RailSkeleton({ reduceMotion = false }: { reduceMotion?: boolean }) {
  return (
    <RailAwaiting
      kicker="味わいの地図"
      message="銘柄を読み込んでいます"
      reduceMotion={reduceMotion}
    />
  );
}

export function SemanticReading({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <RailAwaiting
      kicker={GUIDE_ROLE}
      message="言葉を読み、味わいの近い銘柄を探しています"
      reduceMotion={reduceMotion}
    />
  );
}

function RailAwaiting({
  kicker,
  message,
  reduceMotion,
}: {
  kicker: string;
  message: string;
  reduceMotion: boolean;
}) {
  const bar = reduceMotion
    ? "bg-[var(--km-ink)]/[0.08]"
    : "animate-pulse bg-[var(--km-ink)]/10";

  return (
    <div role="status" aria-live="polite" aria-label={message}>
      <div className="mb-3 flex items-center gap-2.5">
        <motion.span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--km-accent)]/75"
          animate={
            reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.92, 1.08, 0.92] }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.14em] text-[var(--km-accent)]">{kicker}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--km-ink)]">{message}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] p-3">
        <span className={`block h-2.5 w-[4.5rem] rounded ${bar}`} />
        <span className={`mt-3 block h-6 w-36 rounded ${bar}`} />
        <span className={`mt-2.5 block h-3 w-full rounded ${bar}`} />
        <span className={`mt-1.5 block h-3 w-4/5 rounded ${bar}`} />
        <span className="mt-3 flex items-end justify-between gap-3">
          <span className={`h-3 w-24 rounded ${bar}`} />
          <span className={`h-11 w-11 rounded-full border border-[var(--km-border)] ${bar}`} />
        </span>
        <span className="mt-2 block min-h-[2.5rem]">
          <span className={`block h-2.5 w-16 rounded ${bar}`} />
          <span className="mt-1.5 flex gap-1">
            <span className={`h-4 w-14 rounded ${bar}`} />
            <span className={`h-4 w-16 rounded ${bar}`} />
            <span className={`h-4 w-12 rounded ${bar}`} />
          </span>
        </span>
      </div>

      <p className="mb-1 mt-2.5 font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        近い味わいの銘柄
      </p>
      <ol className="flex flex-col gap-1">
        {[0, 1, 2].map((index) => (
          <li
            key={index}
            className="grid grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5"
          >
            <span className="font-serif text-xs text-[var(--km-gold)]/50">0{index + 2}</span>
            <span className="min-w-0">
              <span className={`block h-3.5 w-28 rounded ${bar}`} />
              <span className={`mt-1.5 block h-2.5 w-16 rounded ${bar}`} />
            </span>
            <span className={`h-8 w-8 rounded-full ${bar}`} />
          </li>
        ))}
      </ol>
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
