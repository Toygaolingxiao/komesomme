"use client";

import {
  AFFILIATE_PR_LABEL,
  AFFILIATE_PR_NOTICE,
  AMAZON_ASSOCIATE_DISCLOSURE,
} from "@/lib/affiliate";
import { RAKUTEN_WEB_SERVICE_CREDIT_HTML } from "@/lib/rakuten/credit";

type DisclosureVariant = "full" | "pr";

/**
 * `full` — Amazon Art.5 + short PR + Rakuten Developers credit. SiteFooter only.
 * `pr` — ※PR plus the short affiliate sentence, visible without hover. Copy lives in `src/lib/affiliate.ts`.
 * Surfaces: `docs/15-disclosure-surfaces.md`.
 */
export function AffiliateDisclosure({
  variant = "full",
  className = "",
}: {
  variant?: DisclosureVariant;
  className?: string;
}) {
  if (variant === "pr") {
    return (
      <p className={`text-[12px] leading-snug text-[var(--km-muted)] ${className}`}>
        <span className="tracking-wide">{AFFILIATE_PR_LABEL}</span>
        <span className="ml-1.5">{AFFILIATE_PR_NOTICE}</span>
      </p>
    );
  }

  return (
    <div className={`space-y-1.5 text-[11px] leading-relaxed text-[var(--km-muted)] ${className}`}>
      <p>{AMAZON_ASSOCIATE_DISCLOSURE}</p>
      <p>{AFFILIATE_PR_NOTICE}</p>
      <div
        className="rakuten-ws-credit"
        dangerouslySetInnerHTML={{ __html: RAKUTEN_WEB_SERVICE_CREDIT_HTML }}
      />
    </div>
  );
}
