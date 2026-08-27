import type { RiceProfileV2 } from "@/types/rice";
import { FOCUS, amazonUrl, furusatoUrl, rakutenUrl } from "./shared";

const LINK_CLASS = `inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border border-[var(--km-border)] px-3 py-2 text-[11px] text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`;

/**
 * Quiet commerce search links. Keywords only, not product pages.
 */
export function PurchaseLinks({ rice }: { rice: RiceProfileV2 }) {
  const links = [
    rice.rakuten_search_keyword
      ? { href: rakutenUrl(rice.rakuten_search_keyword), label: "楽天で探す" }
      : null,
    rice.amazon_search_keyword
      ? { href: amazonUrl(rice.amazon_search_keyword), label: "Amazonで探す" }
      : null,
    rice.furusato_keywords?.[0]
      ? { href: furusatoUrl(rice.furusato_keywords[0]), label: "ふるさと納税で探す" }
      : null,
  ].filter((link): link is { href: string; label: string } => link !== null);

  if (links.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] text-[var(--km-muted)]">購入候補を探す</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
