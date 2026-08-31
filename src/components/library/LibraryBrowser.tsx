"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RiceEncyclopediaManifestEntry } from "@/types/riceEncyclopedia";
import { FOCUS } from "@/components/matrix/shared";
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

export function LibraryBrowser({
  entries,
}: {
  entries: RiceEncyclopediaManifestEntry[];
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("すべて");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (region !== "すべて" && entry.region !== region) return false;
      if (!q) return true;
      const hay = `${entry.name}${entry.reading}${entry.prefecture}${entry.headline}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, region]);

  return (
    <div className={`${SITE_COLUMN} pb-16 pt-6`}>
      <header className="max-w-xl">
        <h1 className="font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
          銘柄ライブラリ
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-pretty text-[var(--km-muted)]">
          {`約${entries.length}銘柄の味わい・料理との相性・由来・炊き方を、一冊の事典にまとめています。`}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 border-b border-[var(--km-border)] pb-6 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="text-[12px] text-[var(--km-muted)]">検索</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="銘柄名・県名・キーワード"
            className={`mt-1.5 h-11 w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/60 px-3 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-accent)] focus:outline-none ${FOCUS}`}
          />
        </label>
        <label className="sm:w-56">
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

      <p className="mt-4 text-[12px] text-[var(--km-muted)]">
        {filtered.length} 件表示
      </p>

      <ul className="mt-2 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/library/${entry.id}`}
              className={`group flex flex-col gap-1 py-4 transition hover:bg-[var(--km-surface-warm)]/40 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${FOCUS}`}
            >
              <span className="min-w-0">
                <span className="block text-[12px] text-[var(--km-muted)]">
                  {entry.prefecture}
                  <span className="mx-1.5 text-[var(--km-muted)]/50">/</span>
                  {entry.region}
                </span>
                <span className="mt-1 block font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                  {entry.name}
                </span>
                {entry.reading ? (
                  <span className="mt-0.5 block text-[11px] text-[var(--km-muted)]">
                    {entry.reading}
                  </span>
                ) : null}
                <span className="mt-2 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)] sm:line-clamp-1">
                  {entry.headline}
                </span>
              </span>
              <span className="shrink-0 text-[12px] text-[var(--km-muted)] sm:text-right">
                甘み {entry.sweetness}
                <span className="mx-1.5 text-[var(--km-muted)]/40">/</span>
                粒感 {entry.hardness}
                <span className="mx-1.5 text-[var(--km-muted)]/40">/</span>
                粘り {entry.stickiness}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--km-muted)]">
          条件に合う銘柄がありません。検索語を変えてみてください。
        </p>
      ) : null}
    </div>
  );
}
