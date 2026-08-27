import type { RiceProfileV2 } from "@/types/rice";
import { FOCUS, amazonUrl, furusatoUrl, rakutenUrl } from "./shared";

const PRIMARY_CLASS = `inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full bg-[var(--km-accent)] px-4 py-2.5 text-[12px] font-medium text-white transition hover:bg-[var(--km-accent-deep)] ${FOCUS}`;

const SECONDARY_CLASS = `inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-2.5 text-[12px] text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`;

/**
 * Commerce search CTAs. Keywords only, not product pages.
 * First link is the primary conversion action.
 */
export function PurchaseLinks({
  rice,
  emphasize = false,
}: {
  rice: RiceProfileV2;
  /** Stronger CTA treatment for conversion-focused surfaces. */
  emphasize?: boolean;
}) {
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
      <p
        className={
          emphasize
            ? "font-serif text-[15px] font-semibold text-[var(--km-ink)]"
            : "text-[10px] text-[var(--km-muted)]"
        }
      >
        {emphasize ? "この銘柄を探す" : "購入候補を探す"}
      </p>
      {emphasize ? (
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--km-muted)]">
          キーワード検索で購入候補を開きます
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        {links.map((link, index) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={emphasize && index === 0 ? PRIMARY_CLASS : SECONDARY_CLASS}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
