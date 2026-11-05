"use client";

import { useId, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { FOCUS } from "@/components/matrix/shared";
import { isShopLinksEnabled } from "@/lib/affiliate/shopLinksEnabled";
import type { RiceProfileV2 } from "@/types/rice";

/**
 * Quiet per-row expander in the pair comparison table: the Rakuten text link
 * stays the primary outlet; this reveals the full set of shop links in place.
 */
export function RowShopExpand({ rice }: { rice: RiceProfileV2 }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!isShopLinksEnabled()) return null;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={`mt-1.5 inline-flex items-center gap-1 font-sans text-[12px] font-normal text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
      >
        {open ? "とじる" : "ほかのお店も見る"}
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden
          className={`shrink-0 transition duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-2">
          <ShopLinksStrip
            rice={rice}
            variant="compact"
            expandMode="always"
            title=""
            disclosure="pr"
          />
        </div>
      ) : null}
    </div>
  );
}
