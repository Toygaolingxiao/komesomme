"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RiceEncyclopediaManifestEntry } from "@/types/riceEncyclopedia";
import { TastePips } from "@/components/matrix/TastePips";
import { FOCUS } from "@/components/matrix/shared";
import { brandI18nSearchBlob } from "@/data/rice/brandI18n";
import { isTokuA } from "@/data/rice/tokuA";
import { TokuABadge } from "@/components/rice/TokuABadge";
import { SITE_COLUMN } from "@/components/siteChrome";

const REGIONS = [
  "すべて",
  "北海道・東北",
  "関東・甲信越",
  "東海・北陸",
  "近畿",
  "中国・四国",
  "九州・沖縄",
  "全国銘柄",
] as const;

/** Desktop: name | 甘み | 粒感 | 粘り — columns align like a tasting sheet. */
const ROW_GRID =
  "grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_5.5rem] sm:items-center sm:gap-x-4";

function MetricPips({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="flex flex-col items-start gap-1 sm:items-center">
      <span className="text-[10px] tracking-wide text-[var(--km-muted)] sm:hidden">
        {label}
      </span>
      <span className="inline-flex justify-center" aria-label={`${label} ${Math.round(value)}`}>
        <TastePips value={value} size="sm" />
      </span>
    </span>
  );
}

export function LibraryBrowser({
  entries,
  showPageTitle = true,
}: {
  entries: RiceEncyclopediaManifestEntry[];
  /** Masthead already has the page h1. */
  showPageTitle?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("すべて");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (region !== "すべて" && entry.region !== region) return false;
      if (!q) return true;
      const hay =
        `${entry.name}${entry.reading}${entry.prefecture}${entry.headline}${brandI18nSearchBlob(entry.id)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, region]);

  return (
    <div className={`${SITE_COLUMN} pb-16 pt-6`}>
      <div className="mx-auto w-full max-w-4xl">
        {showPageTitle ? (
          <header className="max-w-xl">
            <h1 className="font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
              銘柄ライブラリ
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-pretty text-[var(--km-muted)]">
              {`約${entries.length}銘柄。甘み・粒感・粘りを点で見比べ、気になる銘柄から読めます。`}
            </p>
          </header>
        ) : (
          <header className="max-w-xl">
            <h2 className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)]">
              味わいで見比べる
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-pretty text-[var(--km-muted)]">
              甘み・粒感・粘りを点で見比べます。
            </p>
          </header>
        )}

        <div className="mt-8 flex flex-col gap-3 border-b border-[var(--km-border)] pb-6 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="text-[12px] text-[var(--km-muted)]">検索</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="銘柄名・県名・中国語・英語"
              className={`mt-1.5 h-11 w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/60 px-3 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-accent)] focus:outline-none ${FOCUS}`}
            />
          </label>
          <label className="sm:w-48">
            <span className="text-[12px] text-[var(--km-muted)]">地域</span>
            <select
              value={region}
              onChange={(event) =>
                setRegion(event.target.value as (typeof REGIONS)[number])
              }
              className={`mt-1.5 h-11 w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/60 px-3 text-sm text-[var(--km-ink)] focus:border-[var(--km-accent)] focus:outline-none ${FOCUS}`}
            >
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <p className="text-[12px] text-[var(--km-muted)]">{filtered.length} 件表示</p>
        </div>

        <div
          className={`${ROW_GRID} mt-3 hidden border-b border-[var(--km-border)] pb-2 text-[11px] tracking-wide text-[var(--km-muted)] sm:grid`}
          aria-hidden
        >
          <span>銘柄</span>
          <span className="text-center">甘み</span>
          <span className="text-center">粒感</span>
          <span className="text-center">粘り</span>
        </div>

        <ul className="divide-y divide-[var(--km-border)] border-b border-[var(--km-border)] sm:border-t-0">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/library/${entry.id}`}
                className={`group ${ROW_GRID} py-3.5 transition hover:bg-[var(--km-surface-warm)]/50 sm:py-3 ${FOCUS}`}
              >
                <span className="min-w-0">
                  <span className="block text-[11px] text-[var(--km-muted)]">
                    {entry.prefecture}
                    <span className="mx-1 text-[var(--km-muted)]/45">·</span>
                    {entry.region}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-serif text-[1.125rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                      {entry.name}
                    </span>
                    {isTokuA(entry.id) ? <TokuABadge compact /> : null}
                  </span>
                  {entry.reading ? (
                    <span className="mt-0.5 block text-[11px] text-[var(--km-muted)]">
                      {entry.reading}
                    </span>
                  ) : null}
                </span>

                <div className="flex gap-4 sm:contents">
                  <MetricPips label="甘み" value={entry.sweetness} />
                  <MetricPips label="粒感" value={entry.hardness} />
                  <MetricPips label="粘り" value={entry.stickiness} />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[var(--km-muted)]">
            見つかりませんでした。言葉を少し変えて、もう一度どうぞ。
          </p>
        ) : null}
      </div>
    </div>
  );
}
