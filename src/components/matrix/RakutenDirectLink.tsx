import { FOCUS } from "@/components/matrix/shared";
import { AFFILIATE_LINK_REL, shopQuery } from "@/lib/affiliate";
import { isShopLinksEnabled } from "@/lib/affiliate/shopLinksEnabled";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import type { RiceProfileV2 } from "@/types/rice";

/**
 * First-screen Rakuten CTA for brand pages. The search URL is fully
 * derivable from catalog data at build time, so this stays a plain SSR
 * anchor — no client JS, no tracking (the bottom shop strip keeps its own).
 */
export function RakutenDirectLink({ rice }: { rice: RiceProfileV2 }) {
  if (!isShopLinksEnabled()) return null;

  const keyword =
    riceRakutenKeyword(rice) ||
    shopQuery({ prefecture: rice.prefecture, brand: rice.name });
  const href = wrapRakutenAffiliateUrl(rakutenSearchUrl(keyword));

  return (
    <div className="max-w-xs">
      <a
        href={href}
        target="_blank"
        rel={AFFILIATE_LINK_REL}
        className={`block w-full no-underline ${FOCUS}`}
      >
        {/* Fill lives on a span: :visited on <a> strips background-color (history privacy). */}
        <span className="relative inline-flex min-h-11 w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-2.5 text-center text-[13px] font-medium text-[var(--km-ink)] transition hover:bg-[var(--km-surface-warm)]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: "#bf0000" }}
          />
          楽天市場で探す
        </span>
      </a>
    </div>
  );
}
