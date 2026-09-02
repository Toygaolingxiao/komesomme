"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CaretDown,
  MapPin,
  X,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import {
  DISCLAIMER,
  FOCUS,
  ICON_WEIGHT,
  LAYER,
  affinityDisplay,
  affinityLabel,
  appetiteLine,
  coreTasteMetrics,
  extraTasteMetrics,
  regionColor,
  shortTasteTags,
  technicalLine,
  todayServeLine,
} from "./shared";
import { ForYou, SimilarRiceCards } from "./CompareSection";
import { DetailScrollTracker } from "./DetailScrollTracker";
import { ShareCardActions } from "@/components/brand/ShareCardActions";
import { PurchaseJump, PurchaseLead } from "./PurchaseLinks";
import { TasteContour } from "./TasteContour";
import { TastePips } from "./TastePips";

function PairingLine({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
      <span className="font-medium text-[var(--km-ink)]">{label}</span>
      <span className="mx-2 text-[var(--km-muted)]">/</span>
      {items.join("、")}
    </p>
  );
}

function CoreTaste({ rice }: { rice: RiceProfileV2 }) {
  const core = coreTasteMetrics(rice);

  return (
    <section>
      <h4 className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">味わい</h4>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
        {core.map(([label, value]) => (
          <TastePips key={label} label={label} value={value} size="sm" />
        ))}
      </div>
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
        今日の食べ方
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
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] text-[var(--km-muted)]">{label}</dt>
            <dd className="mt-0.5 font-serif text-lg leading-none text-[var(--km-brown)]">
              {value}
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
  const scrollRef = useRef<HTMLDivElement>(null);
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
          className="pointer-events-auto flex max-h-[88dvh] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-[var(--km-border)] bg-[var(--km-surface)] text-[var(--km-ink)] shadow-[0_24px_60px_-24px_rgba(112,69,34,0.45)] md:max-h-[86vh] md:w-[min(92vw,900px)] md:rounded-[1.5rem]"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--km-ink)]/15 md:hidden" />

          <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto">
            <DetailScrollTracker root={scrollRef} />
            <div
              className="relative min-w-0 px-5 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-6"
              style={{
                background: `linear-gradient(180deg, ${fill}26 0%, transparent 78%)`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    id="km-detail-title"
                    className="font-serif text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--km-ink)] sm:text-3xl"
                  >
                    {rice.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--km-muted)]">
                    <MapPin size={13} weight={ICON_WEIGHT} />
                    {rice.prefecture} / {rice.region}
                  </p>
                  {tags.length > 0 ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--km-brown)]">
                      {tags.join("、")}
                    </p>
                  ) : null}
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
                className="mt-5 max-w-[46ch] break-words font-serif text-[17px] leading-[1.85] text-[var(--km-ink)] [overflow-wrap:anywhere]"
              >
                {appetite}
              </p>
              {technical ? (
                <p className="mt-2 max-w-[46ch] text-[12px] leading-relaxed text-[var(--km-muted)]">
                  {technical}
                </p>
              ) : null}
              <div className="mt-5">
                <PurchaseLead rice={rice} bare />
              </div>
              <ShareCardActions rice={rice} compact />
            </div>

            <div className="min-w-0 px-5 pb-6 sm:px-8 sm:pb-8">
              <ForYou rice={rice} />

              <div className="mt-8 space-y-3">
                <PairingLine label="料理" items={rice.best_match_dishes} />
                <PairingLine label="食材" items={rice.good_with} />
                {rice.avoid_pairings.length > 0 ? (
                  <p className="text-xs leading-relaxed text-[var(--km-muted)]">
                    控えたい組み合わせ：{rice.avoid_pairings.join("、")}
                  </p>
                ) : null}
              </div>

              <div className="mt-8">
                <TodayEat rice={rice} appetite={appetite} />
              </div>

              {rice.sommelier_note ? (
                <blockquote className="mt-8 border-l-2 border-[var(--km-gold)] pl-4">
                  <p className="text-[12px] text-[var(--km-gold)]">侍米師メモ</p>
                  <p className="mt-2 font-serif text-[13px] leading-[1.9] text-[var(--km-ink-soft)]">
                    {rice.sommelier_note}
                  </p>
                </blockquote>
              ) : null}

              <div className="mt-8">
                <TasteContour rice={rice} compact />
              </div>

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
                  <div className="mt-4">
                    <SoftMetrics title="詳しい味わい" items={extraTasteMetrics(rice)} />
                  </div>
                </details>
              </div>

              {neighbours.length > 0 ? (
                <div className="mt-8">
                  <SimilarRiceCards neighbours={neighbours} onSelect={onSelect} />
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-5 border-t border-[var(--km-border)] pt-6">
                <PurchaseJump label="お店で探すへ戻る" />
                <Link
                  href={`/library/${rice.id}`}
                  className={`inline-flex w-fit items-center gap-1 text-[13px] text-[var(--km-ink-soft)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
                >
                  産地や炊き方は、ライブラリでどうぞ
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
