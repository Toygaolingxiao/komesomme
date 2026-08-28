"use client";

import { ArrowRight, ArrowUpRight, BowlFood, MapPin, Sparkle } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import type { RiceProfileV2 } from "@/types/rice";
import {
  FOCUS,
  ICON_WEIGHT,
  affinityDisplay,
  affinityLabel,
  appetiteLine,
  dishTags,
  pairTasteTags,
  regionColor,
  type RailMatch,
} from "./shared";

export function MobileTodayCard({
  match,
  loading,
  onOpen,
}: {
  match: RailMatch | null;
  loading?: boolean;
  onOpen: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="h-[9rem] animate-pulse rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)]" />
    );
  }

  if (!match) return null;

  const fill = match.rice.region_color ?? regionColor(match.rice.region);
  const dishes = dishTags(match.rice).slice(0, 3);
  const label = affinityLabel(match.score);
  const intro = match.reason?.trim() || appetiteLine(match.rice);

  return (
    <button
      type="button"
      onClick={() => {
        track("recommendation_detail_click", { id: match.rice.id });
        onOpen(match.rice.id);
      }}
      className={`w-full rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] p-4 text-left shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)] ${FOCUS}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-[var(--km-accent)]">
            <Sparkle size={12} weight="fill" />
            今日の一膳
          </span>
          <span className="mt-1.5 block font-serif text-[1.25rem] font-semibold leading-snug text-[var(--km-ink)]">
            {match.rice.name}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-[var(--km-muted)]">
            <MapPin size={12} weight={ICON_WEIGHT} className="shrink-0" />
            <span>
              {match.rice.prefecture}産
              <span className="text-[var(--km-brown)]">・{label}</span>
            </span>
          </span>
        </span>
        {match.score > 0 ? (
          <span
            aria-label={`${label}、味わい相性 ${affinityDisplay(match.score)}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)] text-center"
          >
            <span>
              <span className="block text-[8px] leading-tight text-[var(--km-muted)]">
                {label}
              </span>
              <span className="mt-0.5 block font-serif text-[1.05rem] leading-none text-[var(--km-brown)]">
                {affinityDisplay(match.score)}
              </span>
            </span>
          </span>
        ) : null}
      </span>

      <span className="mt-3 block break-words text-[13px] leading-[1.7] text-[var(--km-ink)] [overflow-wrap:anywhere]">
        {intro}
      </span>

      {dishes.length > 0 ? (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {dishes.map((dish) => (
            <span
              key={dish}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[var(--km-brown)]"
              style={{ background: `${fill}22` }}
            >
              <BowlFood size={11} weight={ICON_WEIGHT} />
              {dish}
            </span>
          ))}
        </span>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--km-accent)]">
        相性・購入候補を見る
        <ArrowRight size={13} weight={ICON_WEIGHT} />
      </span>
    </button>
  );
}

export function MobileSelectedCard({
  rice,
  isBestMatch,
  onOpen,
}: {
  rice: RiceProfileV2;
  isBestMatch: boolean;
  onOpen: () => void;
}) {
  const fill = rice.region_color ?? regionColor(rice.region);
  const tags = pairTasteTags(rice);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] px-3.5 py-3">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: fill }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[0.12em] text-[var(--km-accent)]">
          {isBestMatch ? "いちばん近い一膳" : "選んだ銘柄"}
        </p>
        <p className="font-serif text-[16px] font-semibold leading-snug text-[var(--km-ink)]">
          {rice.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--km-muted)]">{rice.prefecture}</p>
        {tags.length > 0 ? (
          <p className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[var(--km-surface-warm)] px-1.5 py-0.5 text-[9px] text-[var(--km-brown)]"
              >
                {tag}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          track("recommendation_detail_click", { id: rice.id });
          onOpen();
        }}
        className={`shrink-0 rounded-full border border-[var(--km-border)] px-3 py-2 text-[11px] text-[var(--km-accent)] ${FOCUS}`}
      >
        相性を見る
      </button>
    </div>
  );
}

export function OpenMapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 px-4 py-3 text-[var(--km-ink)] ${FOCUS}`}
    >
      <span className="inline-flex items-center gap-2 text-sm">
        <ArrowUpRight size={16} weight={ICON_WEIGHT} />
        地図を大きく見る
      </span>
      <span className="text-[10px] text-[var(--km-muted)]">
        ほかの銘柄も探せます
      </span>
    </button>
  );
}
