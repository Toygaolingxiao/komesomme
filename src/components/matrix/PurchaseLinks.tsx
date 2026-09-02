"use client";

import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { isShopLinksEnabled } from "@/lib/affiliate/shopLinksEnabled";
import { FOCUS } from "@/components/matrix/shared";
import type { RiceProfileV2 } from "@/types/rice";

/** Immediate buy strip (single primary CTA on a page). */
export function PurchaseLead({
  rice,
  bare = false,
}: {
  rice: RiceProfileV2;
  /** Skip nested surface card (library dossier). */
  bare?: boolean;
}) {
  if (!isShopLinksEnabled()) return null;
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

/**
 * Full shop strip — use once per page (library 「購入の目安」).
 * Prefer this over stacking with PurchaseLead.
 */
export function PurchaseLinks({
  rice,
  bare = false,
}: {
  rice: RiceProfileV2;
  /** Hide the strip heading when the parent section already names the purchase block. */
  bare?: boolean;
}) {
  if (!isShopLinksEnabled()) return null;
  return (
    <div id="km-purchase">
      <ShopLinksStrip
        rice={rice}
        variant="full"
        title={bare ? "" : "お店で探す"}
        disclosure="pr"
      />
    </div>
  );
}

/** In-page jump when the real strip lives elsewhere (avoids double mall stacks). */
export function PurchaseJump({
  href = "#km-purchase",
  label = "お店で探す",
}: {
  href?: string;
  label?: string;
}) {
  if (!isShopLinksEnabled()) return null;
  return (
    <a
      href={href}
      className={`inline-flex w-fit text-[13px] text-[var(--km-brown)] underline-offset-4 transition hover:text-[var(--km-gold)] hover:underline ${FOCUS}`}
    >
      {label}
    </a>
  );
}
