"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  LAYER,
  amazonUrl,
  furusatoUrl,
  rakutenUrl,
} from "./shared";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "確度 高",
  medium: "確度 中",
  low: "確度 低",
};

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-[var(--km-muted)]">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-2.5 py-1 text-[11px] text-[var(--km-ink-soft)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreGrid({ rice }: { rice: RiceProfileV2 }) {
  const rows: Array<[string, number]> = [
    ["粒感", rice.hardness],
    ["甘み", rice.sweetness],
    ["粘り", rice.stickiness],
    ["香り", rice.aroma],
    ["旨み", rice.umami],
    ["余韻", rice.aftertaste],
    ["粒の大きさ", rice.grain_size],
    ["淡麗さ", rice.clarity],
    ["コク", rice.richness],
    ["冷めても", rice.cold_rice_quality],
    ["タレ相性", rice.sauce_absorption],
    ["油相性", rice.oil_compatibility],
  ];

  return (
    <dl className="mt-6 grid grid-cols-3 gap-x-4 gap-y-3 border-y border-[var(--km-border)] py-5">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
          <dd className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg leading-none text-[var(--km-ink)]">
              {value}
            </span>
            <span
              aria-hidden
              className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--km-ink)]/10"
            >
              <span
                className="block h-full rounded-full bg-[var(--km-accent)]/55"
                style={{ width: `${((value - 1) / 4) * 100}%` }}
              />
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Brand detail drawer.
 *
 * Bottom sheet on mobile, side drawer from md upward, so the map stays visible on
 * wide screens.
 */
export function BrandDetailPanel({
  rice,
  score,
  neighbours,
  reduceMotion,
  onSelect,
  onClose,
}: {
  rice: RiceProfileV2;
  score: number;
  neighbours: RiceMatchResult[];
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const seasons: Array<[string, string[]]> = [
    ["春", rice.spring_pairings],
    ["夏", rice.summer_pairings],
    ["秋", rice.autumn_pairings],
    ["冬", rice.winter_pairings],
  ];

  const drinks: Array<[string, string[]]> = [
    ["日本酒", rice.sake_pairings],
    ["ビール", rice.beer_pairings],
    ["ワイン", rice.wine_pairings],
    ["ウイスキー", rice.whisky_pairings],
    ["お茶", rice.tea_pairings],
  ];

  return (
    <div className="fixed inset-0" style={{ zIndex: LAYER.overlay }}>
      <motion.button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 h-full w-full bg-[var(--km-ink)]/28 backdrop-blur-sm"
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${rice.name} の詳細`}
        initial={reduceMotion ? false : { y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0.5 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border-t border-[var(--km-border)] bg-[var(--km-surface)]/97 px-6 py-8 text-[var(--km-ink)] backdrop-blur-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[520px] md:border-l md:border-t-0 md:px-10 md:py-12"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold leading-tight tracking-tighter text-[var(--km-ink)]">
              {rice.name}
            </h3>
            <p className="mt-2 text-xs text-[var(--km-muted)]">
              {rice.prefecture}・{rice.region}
            </p>
            <p className="mt-1 text-[11px] text-[var(--km-muted)]">
              {rice.texture_label}／{rice.sweetness_label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--km-border)] text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`}
          >
            <X size={15} weight={ICON_WEIGHT} />
          </button>
        </div>

        <p className="mt-6 max-w-[44ch] text-sm leading-[1.85] text-[var(--km-ink-soft)]">
          {rice.description}
        </p>

        {rice.sommelier_note ? (
          <blockquote className="mt-5 rounded-2xl border border-[var(--km-gold)]/25 bg-[#f6ecd8]/70 px-4 py-3.5 text-xs leading-relaxed text-[var(--km-ink-soft)]">
            <span className="mb-1.5 block text-[10px] tracking-[0.12em] text-[var(--km-accent)]">
              侍米師メモ
            </span>
            {rice.sommelier_note}
          </blockquote>
        ) : null}

        <ScoreGrid rice={rice} />

        <div className="mt-7 flex flex-col gap-5">
          <TagList label="相性の良い料理" items={rice.best_match_dishes} />
          <TagList label="相性のよい食材" items={rice.good_with} />
          {rice.avoid_pairings.length > 0 ? (
            <div>
              <p className="text-xs text-[var(--km-muted)]">控えたい組み合わせ</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--km-ink-soft)]">
                {rice.avoid_pairings.join("、")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <p className="text-xs text-[var(--km-muted)]">季節の相性</p>
          <dl className="mt-3 divide-y divide-[var(--km-border)]">
            {seasons.map(([season, items]) =>
              items.length > 0 ? (
                <div key={season} className="flex gap-4 py-2.5">
                  <dt className="w-8 shrink-0 text-xs text-[var(--km-accent)]">{season}</dt>
                  <dd className="text-xs leading-relaxed text-[var(--km-ink-soft)]">
                    {items.join("、")}
                  </dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

        <div className="mt-8">
          <p className="text-xs text-[var(--km-muted)]">お酒・お茶との相性</p>
          <dl className="mt-3 divide-y divide-[var(--km-border)]">
            {drinks.map(([drink, items]) =>
              items.length > 0 ? (
                <div key={drink} className="flex gap-4 py-2.5">
                  <dt className="w-20 shrink-0 text-xs text-[var(--km-ink)]">{drink}</dt>
                  <dd className="text-xs leading-relaxed text-[var(--km-ink-soft)]">
                    {items.join("、")}
                  </dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          <TagList label="こんな気分に" items={rice.mood_pairings} />
          <TagList label="こんな場面に" items={rice.occasion_pairings} />
          <TagList label="暮らしのシーン" items={rice.lifestyle_scenes} />
        </div>

        {neighbours.length > 0 ? (
          <div className="mt-9">
            <p className="text-xs text-[var(--km-muted)]">似ている銘柄</p>
            <ul className="mt-3 divide-y divide-[var(--km-border)]">
              {neighbours.map((neighbour) => (
                <li key={neighbour.rice.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(neighbour.rice.id)}
                    className={`group flex w-full items-baseline justify-between gap-4 py-3 text-left ${FOCUS}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--km-ink-soft)] transition-colors group-hover:text-[var(--km-accent)]">
                        {neighbour.rice.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--km-muted)]">
                        {neighbour.rice.prefecture}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums text-[var(--km-muted)]">
                      {neighbour.score}
                      <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-[var(--km-muted)]">
              12項目の味わい評価の近さで比べています。
            </p>
          </div>
        ) : null}

        <p className="mt-8 text-[11px] text-[var(--km-muted)]">
          現在の探針との一致度 {score}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {rice.rakuten_search_keyword ? (
            <a
              href={rakutenUrl(rice.rakuten_search_keyword)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--km-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-gold-strong)] active:scale-[0.98] ${FOCUS}`}
            >
              楽天で探す
              <ArrowUpRight size={15} weight={ICON_WEIGHT} />
            </a>
          ) : null}

          <div className="flex gap-2">
            {rice.amazon_search_keyword ? (
              <a
                href={amazonUrl(rice.amazon_search_keyword)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--km-border)] px-4 py-2.5 text-xs text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/45 hover:text-[var(--km-ink)] ${FOCUS}`}
              >
                Amazon
                <ArrowUpRight size={12} weight={ICON_WEIGHT} />
              </a>
            ) : null}
            {rice.furusato_keywords && rice.furusato_keywords.length > 0 ? (
              <a
                href={furusatoUrl(rice.furusato_keywords[0])}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--km-border)] px-4 py-2.5 text-xs text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/45 hover:text-[var(--km-ink)] ${FOCUS}`}
              >
                ふるさと納税
                <ArrowUpRight size={12} weight={ICON_WEIGHT} />
              </a>
            ) : null}
          </div>

          <Link
            href={`/${rice.id}`}
            className={`mt-1 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            銘柄ページを開く
            <ArrowUpRight size={12} weight={ICON_WEIGHT} />
          </Link>
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-[var(--km-muted)]">
          味わい評価は KomeSomme の編集による目安です（
          {CONFIDENCE_LABEL[rice.data_confidence] ?? "確度 中"}）。公的な測定値ではありません。
        </p>
      </motion.aside>
    </div>
  );
}
