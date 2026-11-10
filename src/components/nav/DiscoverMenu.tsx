"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FOCUS } from "@/components/matrix/shared";

export type CollectionMenuItem = { slug: string; title: string };

/**
 * Desktop ピックアップ menu: the nav item itself opens a panel listing the
 * collections （特集）, so the magazine pages are one click from anywhere
 * without adding a seventh top-level nav item. The diagnosis （米診断） sits
 * pinned at the top of the panel, above the collections, when
 * `showDiagnosis` is set — it does not count as a seventh nav item either.
 * Mobile keeps the plain pill link in SiteHeader.
 */
export function DiscoverMenu({
  active,
  items,
  showDiagnosis,
}: {
  active?: boolean;
  items: CollectionMenuItem[];
  showDiagnosis?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1 font-serif text-[13px] tracking-wide transition-[color,transform] duration-150 ease-out active:scale-[0.97] ${FOCUS} ${
          active
            ? "font-semibold text-[var(--km-ink)]"
            : "text-[var(--km-muted)] hover:text-[var(--km-gold)]"
        }`}
      >
        ピックアップ
        <span
          aria-hidden
          className={`text-[9px] leading-none transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] p-2 shadow-lg">
          {showDiagnosis ? (
            <>
              <Link
                href="/shindan"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 font-serif text-[13px] font-semibold text-[var(--km-ink)] transition-colors hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
              >
                侍米師の米診断
                <span className="mt-0.5 block font-sans text-[11px] font-normal leading-relaxed text-[var(--km-muted)]">
                  三つの質問で、今日の相棒米を出します。
                </span>
              </Link>
              <div
                aria-hidden
                className="mx-3 my-2 border-t border-[var(--km-border)]"
              />
            </>
          ) : null}
          <Link
            href="/discover"
            onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-2 font-serif text-[13px] font-semibold text-[var(--km-ink)] transition-colors hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
          >
            ピックアップ
            <span className="mt-0.5 block font-sans text-[11px] font-normal leading-relaxed text-[var(--km-muted)]">
              今日の銘柄と旬の特集の入口です。
            </span>
          </Link>
          <p className="px-3 pb-1 pt-3 text-[11px] tracking-[0.18em] text-[var(--km-muted)]">
            特集
          </p>
          <ul>
            {items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/collections/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-1.5 text-[13px] leading-snug text-[var(--km-ink)] transition-colors hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
