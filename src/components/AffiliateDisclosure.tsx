"use client";

import {
  AFFILIATE_PR_NOTICE,
  AMAZON_ASSOCIATE_DISCLOSURE,
} from "@/lib/affiliate";
import { RAKUTEN_WEB_SERVICE_CREDIT_HTML } from "@/lib/rakuten/credit";

export function AffiliateDisclosure({ className = "" }: { className?: string }) {
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
