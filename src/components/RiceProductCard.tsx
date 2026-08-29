"use client";

import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import type { RiceProfileV2 } from "@/types/rice";
import { firstSentence } from "@/components/matrix/shared";

export function RiceProductCard({ rice }: { rice: RiceProfileV2 }) {
  const summary = rice.short_?.trim() || firstSentence(rice.description) || rice.description;

  return (
    <article className="rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] p-4 sm:p-5">
      <p className="text-[11px] tracking-[0.08em] text-[var(--km-muted)]">{rice.prefecture}</p>
      <h3 className="mt-1 font-serif text-[18px] font-semibold text-[var(--km-ink)]">{rice.name}</h3>
      {summary ? (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">{summary}</p>
      ) : null}

      <ShopLinksStrip
        rice={rice}
        variant="full"
        title=""
        disclosure="full"
        className="mt-4"
      />
    </article>
  );
}
