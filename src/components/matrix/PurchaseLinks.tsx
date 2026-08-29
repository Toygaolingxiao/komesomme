"use client";

import { RiceProductCard } from "@/components/RiceProductCard";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import type { RiceProfileV2 } from "@/types/rice";

/** Immediate buy strip near the top of brand detail (no “候補” framing). */
export function PurchaseLead({ rice }: { rice: RiceProfileV2 }) {
  return (
    <ShopLinksStrip
      rice={rice}
      variant="compact"
      title="取扱オンラインショップ"
      disclosure="pr"
      className="rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/60 p-3"
    />
  );
}

export function PurchaseLinks({ rice }: { rice: RiceProfileV2 }) {
  return (
    <div id="km-purchase">
      <p className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">お店で探す</p>
      <div className="mt-3">
        <RiceProductCard rice={rice} />
      </div>
    </div>
  );
}
