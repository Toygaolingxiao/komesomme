"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RiceEncyclopediaManifestEntry } from "@/types/riceEncyclopedia";
import { FOCUS } from "@/components/matrix/shared";

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

function TastePips({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--km-muted)]">
      <span>{label}</span>
      <span className="inline-flex gap-0.5" aria-label={`${label} ${value}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < value ? "bg-[var(--km-gold)]" : "bg-[var(--km-border)]"
            }`}
          />
        ))}
      </span>
    </span>
  );
}

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
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6 sm:px-5">
      <header className="max-w-2xl">
        <h1 className="font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
          銘柄ライブラリ
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--km-muted)]">
          約 {entries.length}{" "}
          銘柄の味わい・相性・由来・炊き方を、一冊の事典にまとめています。味わい数値は編集評価であり、公的測定ではありません。
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] p-4 shadow-[0_28px_64px_-36px_rgba(112,69,34,0.35)] sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="text-[10px] tracking-[0.12em] text-[var(--km-muted)]">
            検索
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="銘柄名・県名・キーワード"
            className={`mt-1.5 h-11 w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/50 px-3 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-accent)] focus:outline-none ${FOCUS}`}
          />
        </label>
        <label className="sm:w-56">
          <span className="text-[10px] tracking-[0.12em] text-[var(--km-muted)]">
            地域
          </span>
          <select
            value={region}
            onChange={(event) =>
              setRegion(event.target.value as (typeof REGIONS)[number])
            }
            className={`mt-1.5 h-11 w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/50 px-3 text-sm text-[var(--km-ink)] focus:border-[var(--km-accent)] focus:outline-none ${FOCUS}`}
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

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/library/${entry.id}`}
              className={`group flex h-full flex-col rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--km-gold)]/40 hover:shadow-[0_16px_40px_-28px_rgba(112,69,34,0.55)] ${FOCUS}`}
            >
              <span className="text-[10px] tracking-[0.12em] text-[var(--km-muted)]">
                {entry.prefecture}
                <span className="mx-1.5 text-[var(--km-border)]">/</span>
                {entry.region}
              </span>
              <span className="mt-1.5 font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                {entry.name}
              </span>
              {entry.reading ? (
                <span className="mt-0.5 text-[11px] text-[var(--km-muted)]">
                  {entry.reading}
                </span>
              ) : null}
              <span className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-[var(--km-ink-soft)]">
                {entry.headline}
              </span>
              <span className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                <TastePips label="甘み" value={entry.sweetness} />
                <TastePips label="粒感" value={entry.hardness} />
                <TastePips label="粘り" value={entry.stickiness} />
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
