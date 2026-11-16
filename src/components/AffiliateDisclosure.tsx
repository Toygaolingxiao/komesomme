"use client";

import {
  AFFILIATE_PR_NOTICE,
  AMAZON_ASSOCIATE_DISCLOSURE,
} from "@/lib/affiliate";
import { RAKUTEN_WEB_SERVICE_CREDIT_HTML } from "@/lib/rakuten/credit";

/**
 * The site's single in-page affiliate disclosure block: Amazon Art.5 +
 * short PR notice + Rakuten Developers credit. Rendered by SiteFooter
 * (and, for footer-less surfaces that opt in, under a shop strip).
 * No per-CTA ※PR labels anywhere (owner ruling 2026-11-12; docs/15).
 * Copy lives in `src/lib/affiliate.ts`.
 */
export function AffiliateDisclosure({
  className = "",
}: {
  className?: string;
}) {
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
