"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { FOCUS, ICON_WEIGHT } from "@/components/matrix/shared";
import { track } from "@/lib/analytics";
import { jstDateKey } from "@/lib/editorial/jst";

const STORAGE_PREFIX = "km-discover-hint:";

function storageKey(now = Date.now()) {
  return `${STORAGE_PREFIX}${jstDateKey(now)}`;
}

/**
 * Soft, dismissible tip on the home page — once per Tokyo calendar day.
 * Lives outside the map canvas so Desktop 100dvh layout stays intact.
 */
export function DiscoverDailyHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey())) return;
      setVisible(true);
    } catch {
      /* private mode */
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(), "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    track("editorial_discover_dismiss");
  }

  if (!visible) return null;

  return (
    <div
      // Desktop: bottom-left over the map column (not the recommendation rail / consult).
      // Mobile: bottom-right corner.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:justify-start lg:p-6 lg:pb-6"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)]/95 p-4 shadow-[0_12px_40px_rgba(48,40,32,0.12)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)]">
              今日のピックアップ
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
              きょうの三銘柄と、旬の特集をまとめました。
            </p>
          </div>
          <button
            type="button"
            aria-label="閉じる"
            onClick={dismiss}
            className={`shrink-0 rounded-md p-1 text-[var(--km-muted)] hover:text-[var(--km-ink)] ${FOCUS}`}
          >
            <X weight={ICON_WEIGHT} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Link
            href="/discover"
            onClick={() => {
              try {
                window.localStorage.setItem(storageKey(), "1");
              } catch {
                /* ignore */
              }
              track("editorial_discover_open", { via: "hint" });
            }}
            className={`font-serif text-[13px] font-semibold text-[var(--km-brown)] hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            開く
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className={`text-[12px] text-[var(--km-muted)] hover:text-[var(--km-ink)] ${FOCUS}`}
          >
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
