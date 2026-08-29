"use client";

import { RiceProductCard } from "@/components/RiceProductCard";
import { track } from "@/lib/analytics";
import { wrapSatofullSearchUrl, furusatoQuery } from "@/lib/affiliate";
import type { RiceProfileV2 } from "@/types/rice";
import { FOCUS, furusatoKeyword } from "./shared";

const CTA_CLASS = `inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-semibold transition ${FOCUS}`;

export function PurchaseLead({ rice }: { rice: RiceProfileV2 }) {
  const furusato = wrapSatofullSearchUrl(
    furusatoKeyword(rice) || furusatoQuery({ prefecture: rice.prefecture, brand: rice.name })
  );

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="#km-purchase"
        className={`${CTA_CLASS} border border-[var(--km-brown)]/25 bg-[var(--km-surface-warm)] text-[var(--km-brown)] hover:border-[var(--km-gold)]/40`}
        onClick={(event) => {
          event.preventDefault();
          track("purchase_cta_click", { target: "candidates" });
          document.getElementById("km-purchase")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      >
        購入候補を見る
      </a>
      <a
        href={furusato}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`${CTA_CLASS} border border-[var(--km-border)] text-[var(--km-muted)] hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)]`}
        onClick={() => {
          track("purchase_cta_click", { target: "furusato" });
          track("furusato_click", { label: "top" });
        }}
      >
        ふるさと納税で探す
      </a>
    </div>
  );
}

export function PurchaseLinks({ rice }: { rice: RiceProfileV2 }) {
  return (
    <div id="km-purchase">
      <p className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">この銘柄を探す</p>
      <div className="mt-3">
        <RiceProductCard rice={rice} />
      </div>
    </div>
  );
}
