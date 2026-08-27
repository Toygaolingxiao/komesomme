"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BeerBottle,
  BowlFood,
  Fish,
  Flame,
  Flower,
  Heart,
  Leaf,
  MapPin,
  ShoppingBag,
  Snowflake,
  Sparkle,
  Wine,
  X,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  LAYER,
  TAG_TONES,
  amazonUrl,
  furusatoUrl,
  rakutenUrl,
  regionColor,
  shortTasteTags,
} from "./shared";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "確度 高",
  medium: "確度 中",
  low: "確度 低",
};

const SEASON_TONE: Record<
  string,
  { bg: string; border: string; text: string; icon: typeof Leaf }
> = {
  春: { bg: "#fdf0f3", border: "#c85a72", text: "#6b2a3a", icon: Flower },
  夏: { bg: "#eef6f1", border: "#4c9b72", text: "#1f4d38", icon: Leaf },
  秋: { bg: "#fff6e5", border: "#d49a2a", text: "#704522", icon: Flame },
  冬: { bg: "#eef5f7", border: "#3f8fa3", text: "#245a68", icon: Snowflake },
};

function PairingChip({ item, index }: { item: string; index: number }) {
  const tone = TAG_TONES[index % TAG_TONES.length];
  return (
    <li
      className="rounded-md px-2 py-1 text-[11px] leading-snug"
      style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.text }}
    >
      {item}
    </li>
  );
}

function TagList({
  label,
  items,
  icon: Icon,
}: {
  label: string;
  items: string[];
  icon: typeof BowlFood;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-[var(--km-muted)]">
        <Icon size={13} weight={ICON_WEIGHT} />
        {label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <PairingChip key={item} item={item} index={index} />
        ))}
      </ul>
    </div>
  );
}

function MetricGroup({
  title,
  items,
}: {
  title: string;
  items: Array<[string, number]>;
}) {
  return (
    <section>
      <h4 className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">{title}</h4>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-2.5 py-2"
          >
            <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif text-xl leading-none text-[var(--km-brown)]">
                {value}
              </span>
              <span
                aria-hidden
                className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--km-ink)]/10"
              >
                <span
                  className="block h-full rounded-full bg-[var(--km-gold)]"
                  style={{ width: `${((value - 1) / 4) * 100}%` }}
                />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Brand tasting card.
 *
 * Centered modal on md+, bottom sheet on small screens. Overlay click and Escape close.
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const fill = rice.region_color ?? regionColor(rice.region);
  const tags = shortTasteTags(rice);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const seasons: Array<[string, string[]]> = [
    ["春", rice.spring_pairings],
    ["夏", rice.summer_pairings],
    ["秋", rice.autumn_pairings],
    ["冬", rice.winter_pairings],
  ];

  const drinks: Array<[string, string[], typeof Wine]> = [
    ["日本酒", rice.sake_pairings, Wine],
    ["ビール", rice.beer_pairings, BeerBottle],
    ["ワイン", rice.wine_pairings, Wine],
    ["ウイスキー", rice.whisky_pairings, Wine],
    ["お茶", rice.tea_pairings, Leaf],
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
        transition={{ duration: 0.28 }}
        className="absolute inset-0 h-full w-full bg-[var(--km-ink)]/32 backdrop-blur-[6px]"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-center md:p-6">
        <motion.article
          role="dialog"
          aria-modal="true"
          aria-labelledby="km-detail-title"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="pointer-events-auto flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-[var(--km-border)] bg-[var(--km-surface)] text-[var(--km-ink)] shadow-[0_24px_60px_-24px_rgba(112,69,34,0.45)] md:max-h-[86vh] md:w-[min(92vw,860px)] md:rounded-[1.5rem]"
        >
        <div
          aria-hidden
          className="h-1.5 w-full"
          style={{ background: fill }}
        />
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--km-ink)]/15 md:hidden" />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-[var(--km-accent)]">
                <Sparkle size={12} weight={ICON_WEIGHT} />
                銘柄品鑑
              </p>
              <h3
                id="km-detail-title"
                className="mt-1 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--km-ink)] sm:text-3xl"
              >
                {rice.name}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-xs text-[var(--km-muted)]">
                <MapPin size={13} weight={ICON_WEIGHT} />
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: fill }}
                />
                {rice.prefecture}・{rice.region}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <PairingChip key={tag} item={tag} index={index} />
                ))}
              </ul>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--km-border)] text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`}
            >
              <X size={15} weight={ICON_WEIGHT} />
            </button>
          </div>

          {score > 0 ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--km-surface-warm)] px-3 py-1 text-[11px] text-[var(--km-brown)]">
              <Sparkle size={14} weight="fill" className="text-[var(--km-gold)]" />
              今日の相性 {score}
            </p>
          ) : null}

          <p className="mt-5 max-w-[62ch] text-sm leading-[1.9] text-[var(--km-ink-soft)]">
            {rice.description}
          </p>

          {rice.sommelier_note ? (
            <blockquote className="mt-5 rounded-2xl border border-[var(--km-gold)]/35 bg-[var(--km-surface-warm)] px-4 py-3.5 text-xs leading-relaxed text-[var(--km-ink-soft)]">
              <span className="mb-1.5 flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-[var(--km-accent)]">
                <Sparkle size={12} weight={ICON_WEIGHT} />
                米ソムリエメモ
              </span>
              {rice.sommelier_note}
            </blockquote>
          ) : null}

          <div className="mt-6 flex flex-col gap-5">
            <MetricGroup
              title="基本の味わい"
              items={[
                ["粒感", rice.hardness],
                ["甘み", rice.sweetness],
                ["粘り", rice.stickiness],
                ["香り", rice.aroma],
                ["旨み", rice.umami],
              ]}
            />
            <MetricGroup
              title="食卓での相性"
              items={[
                ["冷めても", rice.cold_rice_quality],
                ["タレ相性", rice.sauce_absorption],
                ["油相性", rice.oil_compatibility],
                ["余韻", rice.aftertaste],
                ["淡麗さ", rice.clarity],
              ]}
            />
            <MetricGroup
              title="粒の姿"
              items={[
                ["粒の大きさ", rice.grain_size],
                ["コク", rice.richness],
              ]}
            />
          </div>

          <div className="mt-7 flex flex-col gap-5">
            <TagList label="相性の良い料理" items={rice.best_match_dishes} icon={BowlFood} />
            <TagList label="相性のよい食材" items={rice.good_with} icon={Fish} />
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
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {seasons.map(([season, items]) => {
                if (items.length === 0) return null;
                const tone = SEASON_TONE[season];
                const Icon = tone.icon;
                return (
                  <div
                    key={season}
                    className="rounded-2xl px-3 py-2.5"
                    style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
                  >
                    <p
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: tone.text }}
                    >
                      <Icon size={13} weight={ICON_WEIGHT} />
                      {season}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join(" / ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs text-[var(--km-muted)]">お酒・お茶との相性</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {drinks.map(([drink, items, Icon]) =>
                items.length > 0 ? (
                  <div
                    key={drink}
                    className="rounded-xl border border-[var(--km-border)] px-3 py-2"
                  >
                    <dt className="flex items-center gap-1.5 text-xs text-[var(--km-ink)]">
                      <Icon size={13} weight={ICON_WEIGHT} />
                      {drink}
                    </dt>
                    <dd className="mt-1 text-[11px] leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join("、")}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-5">
            <TagList label="こんな気分に" items={rice.mood_pairings} icon={Heart} />
            <TagList label="こんな場面に" items={rice.occasion_pairings} icon={Leaf} />
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
                      <span className="inline-flex shrink-0 items-center gap-1.5 font-serif text-xs text-[var(--km-brown)]">
                        {neighbour.score}
                        <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2">
            {rice.rakuten_search_keyword ? (
              <a
                href={rakutenUrl(rice.rakuten_search_keyword)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--km-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-accent-deep)] active:scale-[0.98] ${FOCUS}`}
              >
                <ShoppingBag size={15} weight={ICON_WEIGHT} />
                購入候補を見る
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
                  ふるさと納税で探す
                  <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                </a>
              ) : null}
            </div>

            <Link
              href={`/${rice.id}`}
              className={`mt-1 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
            >
              この米で探す
              <ArrowUpRight size={12} weight={ICON_WEIGHT} />
            </Link>
          </div>

          <p className="mt-6 text-[10px] leading-relaxed text-[var(--km-muted)]">
            味わい評価は KomeSomme の編集による目安です（
            {CONFIDENCE_LABEL[rice.data_confidence] ?? "確度 中"}
            ）。公的な測定値ではありません。
          </p>
        </div>
        </motion.article>
      </div>
    </div>
  );
}
