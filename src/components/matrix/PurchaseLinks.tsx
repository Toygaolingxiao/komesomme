"use client";

import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import type { RiceProfileV2 } from "@/types/rice";

/** Immediate buy strip near the top of brand detail (no “候補” framing). */
export function PurchaseLead({
  rice,
  bare = false,
}: {
  rice: RiceProfileV2;
  /** Skip nested surface card (library dossier). */
  bare?: boolean;
}) {
  return (
    <div id="km-purchase">
      <ShopLinksStrip
        rice={rice}
        variant="compact"
        title="お店で探す"
        disclosure="pr"
        className={
          bare
            ? undefined
            : "rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/60 p-3"
        }
      />
    </div>
  );
}

/** Full shop strip at the end of a long read — not a second product card. */
export function PurchaseLinks({
  rice,
  bare = false,
}: {
  rice: RiceProfileV2;
  /** Hide the strip heading when the parent section already names the purchase block. */
  bare?: boolean;
}) {
  return (
    <div id="km-purchase-foot">
      <ShopLinksStrip
        rice={rice}
        variant="full"
        title={bare ? "" : "お店で探す"}
        disclosure="pr"
      />
    </div>
  );
}
