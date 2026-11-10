import {
  BUYING_TIPS_LINES,
  BUYING_TIPS_TITLE,
} from "@/lib/diagnosis/questions";

/**
 * 「お得な買い方（侍米師メモ）」 — buying *methods*, never prices (v2 plan
 * ruling, 2026-11-10). Fixed copy lives in questions.ts so the OG font
 * coverage test sees every character this block can render.
 *
 * v1.33.0: the three lines are generic method copy, identical for every
 * brand, so the panel now renders ONCE below the three picks instead of
 * repeating inside each card. Each card keeps its own ShopLinksStrip —
 * its ふるさと納税 tab is the per-brand entrance this panel used to
 * duplicate with a library link.
 */
export function BuyingTipsPanel() {
  return (
    <div className="rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3.5 shadow-[0_1px_2px_rgba(48,40,32,0.04)] sm:px-5 sm:py-4">
      <p className="text-[12px] font-medium tracking-[0.06em] text-[var(--km-brown)]">
        {BUYING_TIPS_TITLE}
      </p>
      <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.8] text-[var(--km-ink-soft)]">
        {BUYING_TIPS_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
