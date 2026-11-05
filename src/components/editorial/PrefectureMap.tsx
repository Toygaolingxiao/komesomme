"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FOCUS, regionColor } from "@/components/matrix/shared";
import { prefectureArtPath } from "@/data/editorial/prefectureArt";
import {
  PREFECTURE_MAP_PATHS,
  PREFECTURE_MAP_VIEWBOX,
} from "@/data/editorial/prefectureMapPaths";
import type { PrefectureMapSummary } from "@/lib/editorial/prefectures";

/**
 * The origin map on /prefectures: every prefecture drawn, the ones the
 * catalogue knows filled with their region colour. A tap opens the
 * prefecture's brands in a small dialog — the doorway in; the full
 * prefecture page (or the brand pages) does the rest. Geometry is
 * svg-japan's "full" layout (MIT), with Okinawa in its inset position.
 */
export function PrefectureMap({
  summaries,
}: {
  summaries: PrefectureMapSummary[];
}) {
  const byName = useMemo(
    () => new Map(summaries.map((summary) => [summary.prefecture, summary])),
    [summaries],
  );
  const regions = useMemo(
    () => [...new Set(summaries.map((summary) => summary.region))],
    [summaries],
  );
  const [selected, setSelected] = useState<PrefectureMapSummary | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected]);

  return (
    <div>
      <p
        aria-live="polite"
        className="text-center text-[13px] text-[var(--km-muted)]"
      >
        {activeName
          ? `${activeName}を選んでいます`
          : "地図の県を押すと、その土地の銘柄が出ます。"}
      </p>

      <svg
        viewBox={PREFECTURE_MAP_VIEWBOX}
        role="group"
        aria-label="日本の地図（都道府県）"
        className="mx-auto mt-3 block h-auto w-full max-w-[430px]"
      >
        {PREFECTURE_MAP_PATHS.map((path) => {
          const summary = byName.get(path.name);
          const active = activeName === path.name;
          if (!summary) {
            return (
              <path
                key={path.code}
                d={path.d}
                fill="#E7DFCC"
                stroke="var(--km-paper)"
                strokeWidth={0.8}
              />
            );
          }
          const fill = regionColor(summary.region);
          return (
            <g key={path.code}>
              <path
                d={path.d}
                fill={fill}
                fillOpacity={
                  summary.pageSlug ? (active ? 0.95 : 0.8) : active ? 0.55 : 0.36
                }
                stroke={active ? "var(--km-gold)" : "var(--km-paper)"}
                strokeWidth={active ? 1.6 : 0.8}
                pointerEvents="none"
                className="transition-[fill-opacity] duration-150"
              />
              <path
                d={path.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth={3.5}
                pointerEvents="all"
                tabIndex={0}
                role="button"
                aria-label={`${summary.prefecture}の銘柄を見る（${summary.brands.length}銘柄）`}
                className="cursor-pointer focus:outline-none"
                onClick={() => setSelected(summary)}
                onMouseEnter={() => setActiveName(path.name)}
                onMouseLeave={() => setActiveName(null)}
                onFocus={() => setActiveName(path.name)}
                onBlur={() => setActiveName(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(summary);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--km-muted)]">
        {regions.map((region) => (
          <li key={region} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: regionColor(region) }}
            />
            {region}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#E7DFCC]"
          />
          まだ記録のない県
        </li>
      </ul>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.prefecture}の銘柄`}
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-[var(--km-surface)] shadow-xl sm:rounded-2xl">
            {selected.pageSlug ? (
              <div className="relative aspect-[16/8] w-full overflow-hidden">
                <Image
                  src={prefectureArtPath(selected.pageSlug)}
                  alt={`${selected.prefecture}の産地`}
                  fill
                  sizes="(min-width: 640px) 28rem, 100vw"
                  className="object-cover"
                  style={{ objectPosition: "50% 42%" }}
                />
              </div>
            ) : null}
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setSelected(null)}
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--km-surface)]/90 text-[15px] text-[var(--km-ink-soft)] transition hover:text-[var(--km-ink)] ${FOCUS}`}
            >
              ×
            </button>
            <div className="p-5 pb-6">
              <p className="text-[12px] text-[var(--km-muted)]">
                {selected.region}
                <span className="mx-2">{selected.brands.length}銘柄</span>
              </p>
              <h3 className="mt-1 font-serif text-[1.5rem] font-semibold tracking-tight text-[var(--km-ink)]">
                {selected.prefecture}の米
              </h3>
              {selected.brands.length >= 2 ? (
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                  味わいの平均像で高めなのは「{selected.topTraitLabels[0]}」と「
                  {selected.topTraitLabels[1]}」です。
                </p>
              ) : null}
              <ul className="mt-4 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
                {selected.brands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={`/library/${brand.id}`}
                      className={`block py-2.5 ${FOCUS}`}
                      onClick={() => setSelected(null)}
                    >
                      <span className="font-serif text-[1.05rem] font-semibold tracking-tight text-[var(--km-ink)]">
                        {brand.name}
                      </span>
                      {brand.headline ? (
                        <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-[var(--km-ink-soft)]">
                          {brand.headline}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              {selected.pageSlug ? (
                <p className="mt-4">
                  <Link
                    href={`/prefectures/${selected.pageSlug}`}
                    className={`inline-flex w-full items-center justify-center rounded-lg border border-[var(--km-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--km-brown)] transition hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
                    onClick={() => setSelected(null)}
                  >
                    {selected.prefecture}のページへ
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
