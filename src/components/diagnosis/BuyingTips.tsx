import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";
import {
  BUYING_TIPS_LINES,
  BUYING_TIPS_LINK_LABEL,
  BUYING_TIPS_TITLE,
} from "@/lib/diagnosis/questions";

/**
 * 「お得な買い方（侍米師メモ）」 — buying *methods*, never prices (v2 plan
 * ruling, 2026-11-10). Fixed copy lives in questions.ts so the OG font
 * coverage test sees every character this block can render.
 */
export function BuyingTips({ riceId }: { riceId: string }) {
  return (
    <div className="mt-4 rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3.5 shadow-[0_1px_2px_rgba(48,40,32,0.04)]">
      <p className="text-[12px] font-medium tracking-[0.06em] text-[var(--km-brown)]">
        {BUYING_TIPS_TITLE}
      </p>
      <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.8] text-[var(--km-ink-soft)]">
        <li>
          {BUYING_TIPS_LINES[0]}{" "}
          <Link
            href={`/library/${riceId}#km-purchase`}
            className={`whitespace-nowrap font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
          >
            {BUYING_TIPS_LINK_LABEL}
          </Link>
        </li>
        <li>{BUYING_TIPS_LINES[1]}</li>
        <li>{BUYING_TIPS_LINES[2]}</li>
      </ul>
    </div>
  );
}
