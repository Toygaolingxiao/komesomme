"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { track } from "@/lib/analytics";
import { isShopLinksEnabled } from "@/lib/affiliate/shopLinksEnabled";
import { FOCUS } from "@/components/matrix/shared";
import type { RiceProfileV2 } from "@/types/rice";

/**
 * Fires `purchase_section_view` once when the purchase block enters the
 * viewport. IntersectionObserver delivers an initial callback right after
 * observe(), so a block already on screen at first paint (SSR) still counts.
 * The observer disconnects after the first hit and on unmount.
 */
function usePurchaseSectionView(riceId: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let reported = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (reported || !entry.isIntersecting) continue;
          reported = true;
          track("purchase_section_view", { id: riceId });
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [riceId]);
  return ref;
}

/** The #km-purchase host: children plus the once-per-page view beacon. */
function PurchaseSection({ rice, children }: { rice: RiceProfileV2; children: ReactNode }) {
  const ref = usePurchaseSectionView(rice.id);
  return (
    <div id="km-purchase" ref={ref}>
      {children}
    </div>
  );
}

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
    <PurchaseSection rice={rice}>
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
    </PurchaseSection>
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
    <PurchaseSection rice={rice}>
      <ShopLinksStrip
        rice={rice}
        variant="full"
        title={bare ? "" : "お店で探す"}
        disclosure="pr"
      />
    </PurchaseSection>
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
