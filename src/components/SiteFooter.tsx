import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { SITE_COLUMN } from "@/components/siteChrome";
import { TASTE_DISCLAIMER } from "@/lib/affiliate";
import { FOCUS } from "@/components/matrix/shared";

const LINKS = [
  { href: "/privacy", label: "プライバシー" },
  { href: "/terms", label: "利用規約" },
  { href: "/tokushoho", label: "特定商取引法" },
] as const;

/** Compact legal links for the home header (keeps Desktop 100dvh intact). */
export function SiteLegalNav({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="法務情報"
      className={`flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[12px] text-[var(--km-muted)] ${className}`}
    >
      {LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-1.5 sm:gap-2">
          {index > 0 ? <span aria-hidden>·</span> : null}
          <Link
            href={link.href}
            className={`transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--km-border)] py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] lg:pb-8">
      <div
        className={`${SITE_COLUMN} flex flex-col gap-3 text-[12px] leading-relaxed text-[var(--km-muted)]`}
      >
        <SiteLegalNav className="justify-start" />
        <AffiliateDisclosure />
        <p>{TASTE_DISCLAIMER}</p>
        <p>
          <Link
            href="https://sommeatlas.com"
            className={`transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            Somme Atlas プロジェクト
          </Link>
        </p>
        <p>© {new Date().getFullYear()} KomeSomme</p>
      </div>
    </footer>
  );
}
