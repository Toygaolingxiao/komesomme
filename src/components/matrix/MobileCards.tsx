"use client";

import { ArrowRight, MapPin } from "@phosphor-icons/react";
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
      <div className="h-[9rem] animate-pulse rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)]" />
    );
  }

  if (!match) return null;

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
      className={`w-full rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] p-4 text-left shadow-[0_16px_40px_-36px_rgba(112,69,34,0.32)] ${FOCUS}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="text-[11px] font-medium tracking-wide text-[var(--km-brown)]">
            今日の一膳
          </span>
          <span className="mt-1.5 block font-serif text-[1.35rem] font-semibold leading-snug tracking-tight text-[var(--km-ink)]">
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
            className="shrink-0 text-right"
          >
            <span className="block text-[9px] leading-tight text-[var(--km-muted)]">
              {label}
            </span>
            <span className="mt-0.5 block font-serif text-[1.35rem] leading-none text-[var(--km-brown)]">
              {affinityDisplay(match.score)}
            </span>
          </span>
        ) : null}
      </span>

      <span className="mt-3.5 block break-words font-serif text-[14px] leading-[1.75] text-[var(--km-ink)] [overflow-wrap:anywhere]">
        {intro}
      </span>

      {dishes.length > 0 ? (
        <span className="mt-3 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
          {dishes.join("、")}
        </span>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--km-accent)]">
        くわしく見る
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
        <p className="text-[11px] font-medium text-[var(--km-brown)]">
          {isBestMatch ? "いちばん近い一膳" : "選んだ銘柄"}
        </p>
        <p className="font-serif text-[16px] font-semibold leading-snug text-[var(--km-ink)]">
          {rice.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--km-muted)]">{rice.prefecture}</p>
        {tags.length > 0 ? (
          <p className="mt-1 text-[11px] text-[var(--km-ink-soft)]">
            {tags.join("、")}
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
