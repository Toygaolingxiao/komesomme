"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BeerBottle,
  BowlFood,
  CaretDown,
  Fish,
  Flame,
  Flower,
  Leaf,
  MapPin,
  Snowflake,
  Sparkle,
  Wine,
  X,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import {
  DISCLAIMER,
  FOCUS,
  ICON_WEIGHT,
  LAYER,
  TAG_TONES,
  affinityDisplay,
  affinityLabel,
  appetiteLine,
  contrastLine,
  isDrinkStyle,
  parseDrinkItem,
  regionColor,
  shortTasteTags,
  technicalLine,
  todayServeLine,
} from "./shared";
import { PurchaseLinks } from "./PurchaseLinks";

const SEASON_TONE: Record<
  string,
  { bg: string; border: string; text: string; icon: typeof Leaf }
> = {
  春: { bg: "#fdf0f3", border: "#c85a72", text: "#6b2a3a", icon: Flower },
  夏: { bg: "#eef6f1", border: "#4c9b72", text: "#1f4d38", icon: Leaf },
  秋: { bg: "#fff6e5", border: "#d49a2a", text: "#704522", icon: Flame },
  冬: { bg: "#eef5f7", border: "#3f8fa3", text: "#245a68", icon: Snowflake },
};

function PairingChip({
  item,
  index,
  icon: Icon,
}: {
  item: string;
  index: number;
  icon?: typeof BowlFood;
}) {
  const tone = TAG_TONES[index % TAG_TONES.length];
  return (
    <li
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] leading-snug"
      style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.text }}
    >
      {Icon ? <Icon size={11} weight={ICON_WEIGHT} /> : null}
      {item}
    </li>
  );
}

function TagList({
  label,
  items,
  icon: Icon,
  chipIcon,
}: {
  label: string;
  items: string[];
  icon: typeof BowlFood;
  chipIcon?: typeof BowlFood;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="flex items-center gap-1.5 font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        <Icon size={14} weight={ICON_WEIGHT} />
        {label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <PairingChip key={item} item={item} index={index} icon={chipIcon} />
        ))}
      </ul>
    </div>
  );
}

function CoreTaste({ rice }: { rice: RiceProfileV2 }) {
  const core: Array<[string, number]> = [
    ["粒感", rice.hardness],
    ["甘み", rice.sweetness],
    ["粘り", rice.stickiness],
    ["旨み", rice.umami],
    ["タレ相性", rice.sauce_absorption],
  ];

  return (
    <section>
      <h4 className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">主要な味わい</h4>
      <dl className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-2">
        {core.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
            <dd className="mt-1 font-serif text-xl leading-none text-[var(--km-brown)] sm:text-2xl">
              {value}
            </dd>
            <span
              aria-hidden
              className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--km-ink)]/8"
            >
              <span
                className="block h-full rounded-full bg-[var(--km-gold)]"
                style={{ width: `${((value - 1) / 4) * 100}%` }}
              />
            </span>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TodayEat({ rice, appetite }: { rice: RiceProfileV2; appetite: string }) {
  const serve = todayServeLine(rice);
  const reason = rice.pairing_reason.trim();
  const showReason = Boolean(reason) && reason !== appetite;
  const days = [...rice.mood_pairings, ...rice.occasion_pairings]
    .filter(Boolean)
    .slice(0, 2);

  if (!serve && !showReason && days.length === 0) return null;

  return (
    <section>
      <h4 className="font-serif text-[15px] font-semibold text-[var(--km-ink)]">
        今日どう食べると美味しいか
      </h4>
      {serve ? (
        <p className="mt-2 font-serif text-[15px] leading-[1.85] text-[var(--km-ink)]">{serve}</p>
      ) : null}
      {showReason ? (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">{reason}</p>
      ) : null}
      {days.length > 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--km-muted)]">
          こんな日に：{days.join("、")}
        </p>
      ) : null}
    </section>
  );
}

function DrinkPairings({ rice }: { rice: RiceProfileV2 }) {
  const groups: Array<[string, string[], typeof Wine, "drink" | "dish"]> = [
    ["日本酒", rice.sake_pairings, Wine, "drink"],
    ["ビール", rice.beer_pairings, BeerBottle, "dish"],
    ["ワイン", rice.wine_pairings, Wine, "drink"],
    ["ウイスキー", rice.whisky_pairings, Wine, "drink"],
    ["お茶", rice.tea_pairings, Leaf, "drink"],
  ];

  const visible = groups.filter(([, items]) => items.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-[11px] tracking-[0.08em] text-[var(--km-muted)]">
        お酒・お茶との相性
      </p>
      <p className="mt-1 text-[10px] text-[var(--km-muted)]">
        米ソムリエの編集による目安です。酒そのものの公式評価ではありません。
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {visible.map(([drink, items, Icon, kind]) => {
          const parsed = items.map(parseDrinkItem);
          const styles = Array.from(
            new Set(
              kind === "drink"
                ? parsed.map((item) => item.style)
                : parsed.filter((item) => isDrinkStyle(item.style)).map((item) => item.style)
            )
          );
          const dishes = parsed
            .map((item) => item.dish)
            .filter((item): item is string => Boolean(item));
          const leftoverDishes =
            kind === "dish"
              ? parsed.filter((item) => !item.dish && !isDrinkStyle(item.style)).map((item) => item.style)
              : [];
          const dishList = [...dishes, ...leftoverDishes];

          return (
            <article key={drink} className="rounded-xl bg-[var(--km-surface-warm)]/70 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs text-[var(--km-ink)]">
                <Icon size={13} weight={ICON_WEIGHT} />
                {drink}
              </p>
              {styles.length > 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--km-ink-soft)]">
                  {styles.join("、")}
                </p>
              ) : null}
              {dishList.length > 0 ? (
                <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--km-muted)]">
                  合わせやすい料理：{dishList.join("、")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SoftMetrics({
  title,
  items,
}: {
  title: string;
  items: Array<[string, number]>;
}) {
  return (
    <section>
      <h4 className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">{title}</h4>
      <dl className="mt-3 flex flex-col gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <dt className="w-[4.5rem] shrink-0 text-[11px] text-[var(--km-muted)]">{label}</dt>
            <dd className="flex min-w-0 flex-1 items-center gap-2">
              <span className="w-4 font-serif text-sm text-[var(--km-brown)]">{value}</span>
              <span
                aria-hidden
                className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--km-ink)]/8"
              >
                <span
                  className="block h-full rounded-full bg-[var(--km-gold)]/75"
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
  const appetite = appetiteLine(rice);
  const technical = technicalLine(rice);
  const shownScore = affinityDisplay(score);
  const scoreLabel = affinityLabel(score);

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
          aria-describedby="km-detail-summary"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="pointer-events-auto flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-[var(--km-border)] bg-[var(--km-surface)] text-[var(--km-ink)] shadow-[0_24px_60px_-24px_rgba(112,69,34,0.45)] md:max-h-[86vh] md:w-[min(92vw,900px)] md:rounded-[1.5rem]"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--km-ink)]/15 md:hidden" />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div
              className="relative px-5 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-6"
              style={{
                background: `linear-gradient(180deg, ${fill}26 0%, transparent 78%)`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-[var(--km-accent)]">
                    <Sparkle size={12} weight={ICON_WEIGHT} />
                    銘柄品鑑
                  </p>
                  <h3
                    id="km-detail-title"
                    className="mt-1 font-serif text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--km-ink)] sm:text-3xl"
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
                    {rice.prefecture} / {rice.region}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag, index) => (
                      <PairingChip key={tag} item={tag} index={index} />
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 items-start gap-3">
                  {score > 0 ? (
                    <span
                      aria-label={`${scoreLabel}、味わい相性 ${shownScore}`}
                      className="grid h-11 w-11 place-items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] text-center"
                    >
                      <span>
                        <span className="block text-[8px] leading-tight text-[var(--km-muted)]">
                          {scoreLabel}
                        </span>
                        <span className="mt-0.5 block font-serif text-[1.05rem] leading-none text-[var(--km-brown)]">
                          {shownScore}
                        </span>
                      </span>
                    </span>
                  ) : null}
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="閉じる"
                    className={`grid h-9 w-9 place-items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)]/80 text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`}
                  >
                    <X size={15} weight={ICON_WEIGHT} />
                  </button>
                </div>
              </div>

              <p
                id="km-detail-summary"
                className="mt-5 max-w-[46ch] break-keep font-serif text-[17px] leading-[1.85] text-[var(--km-ink)]"
              >
                {appetite}
              </p>
              {technical ? (
                <p className="mt-2 max-w-[46ch] text-[12px] leading-relaxed text-[var(--km-muted)]">
                  {technical}
                </p>
              ) : null}
            </div>

            <div className="px-5 pb-6 sm:px-8 sm:pb-8">
              <TodayEat rice={rice} appetite={appetite} />

              {rice.sommelier_note ? (
                <blockquote className="mt-8 border-l-2 border-[var(--km-brown)]/35 bg-[var(--km-surface-warm)]/70 px-4 py-3">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-[var(--km-accent)]">
                    <Sparkle size={12} weight={ICON_WEIGHT} />
                    米ソムリエメモ
                  </span>
                  <p className="font-serif text-[13px] leading-[1.9] text-[var(--km-ink-soft)]">
                    {rice.sommelier_note}
                  </p>
                </blockquote>
              ) : null}

              <div className="mt-8 flex flex-col gap-4">
                <CoreTaste rice={rice} />
                <details className="group">
                  <summary
                    className={`flex cursor-pointer list-none items-center gap-1.5 text-[12px] text-[var(--km-muted)] marker:content-none [&::-webkit-details-marker]:hidden ${FOCUS}`}
                  >
                    <CaretDown
                      size={12}
                      weight={ICON_WEIGHT}
                      className="transition group-open:rotate-180"
                    />
                    詳しい味わいを見る
                  </summary>
                  <div className="mt-4 flex flex-col gap-5">
                    <SoftMetrics
                      title="食事での相性"
                      items={[
                        ["冷めても", rice.cold_rice_quality],
                        ["油相性", rice.oil_compatibility],
                        ["余韻", rice.aftertaste],
                        ["淡麗さ", rice.clarity],
                        ["香り", rice.aroma],
                      ]}
                    />
                    <SoftMetrics
                      title="粒の姿"
                      items={[
                        ["粒の大きさ", rice.grain_size],
                        ["コク", rice.richness],
                      ]}
                    />
                  </div>
                </details>
              </div>

              <div className="mt-8 flex flex-col gap-5">
                <TagList
                  label="相性の良い料理"
                  items={rice.best_match_dishes}
                  icon={BowlFood}
                  chipIcon={BowlFood}
                />
                <TagList label="相性のよい食材" items={rice.good_with} icon={Fish} />
                {rice.avoid_pairings.length > 0 ? (
                  <p className="text-xs leading-relaxed text-[var(--km-muted)]">
                    控えたい組み合わせ：{rice.avoid_pairings.join("、")}
                  </p>
                ) : null}
              </div>

              <div className="mt-8">
                <p className="text-[11px] tracking-[0.08em] text-[var(--km-muted)]">
                  季節の相性
                </p>
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

              <DrinkPairings rice={rice} />

              {neighbours.length > 0 ? (
                <div className="mt-8">
                  <p className="text-[11px] tracking-[0.08em] text-[var(--km-muted)]">
                    似ている銘柄
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {neighbours.map((neighbour) => (
                      <li key={neighbour.rice.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(neighbour.rice.id)}
                          className={`group flex w-full items-baseline justify-between gap-4 rounded-lg px-1 py-1.5 text-left ${FOCUS}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-[var(--km-ink-soft)] transition-colors group-hover:text-[var(--km-accent)]">
                              {neighbour.rice.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-[var(--km-muted)]">
                              {neighbour.rice.prefecture}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-[var(--km-ink-soft)]">
                              {contrastLine(rice, neighbour.rice)}
                            </span>
                          </span>
                          <span className="inline-flex shrink-0 flex-col items-end font-serif text-xs text-[var(--km-brown)]">
                            <span className="text-[9px] font-sans text-[var(--km-muted)]">
                              {affinityLabel(neighbour.score)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              {affinityDisplay(neighbour.score)}
                              <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3">
                <PurchaseLinks rice={rice} />
                <Link
                  href={`/${rice.id}`}
                  className={`inline-flex w-fit items-center gap-1 text-[11px] text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
                >
                  銘柄ページを見る
                  <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                </Link>
              </div>

              <p className="mt-6 text-[10px] leading-relaxed text-[var(--km-muted)]">
                {DISCLAIMER}
              </p>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
