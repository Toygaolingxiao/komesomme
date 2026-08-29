"use client";

import {
  AFFILIATE_PR_NOTICE,
  AMAZON_ASSOCIATE_DISCLOSURE,
} from "@/lib/affiliate";
import { RAKUTEN_WEB_SERVICE_CREDIT_HTML } from "@/lib/rakuten/credit";

type DisclosureVariant = "full" | "pr";

/**
 * `full` — Amazon Art.5 + 景表法 PR + Rakuten Developers credit (purchase card / footer).
 * `pr` — short 「アフィリエイト広告」badge for lifestyle surfaces (home rail).
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
      <p
        className={`text-[10px] leading-none tracking-wide text-[var(--km-muted)] ${className}`}
        title={AFFILIATE_PR_NOTICE}
      >
        ※PR（アフィリエイト広告）
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
