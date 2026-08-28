import Link from "next/link";
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
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--km-muted)] ${className}`}
    >
      {LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-2">
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
    <footer className="mt-10 border-t border-[var(--km-border)] px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-[960px] flex-col gap-3 text-[11px] leading-relaxed text-[var(--km-muted)]">
        <SiteLegalNav />
        <p>
          当サイトの外部リンクにはアフィリエイト広告を含む場合があります。味わい評価は
          KomeSomme 独自基準による目安です。
        </p>
        <p>© {new Date().getFullYear()} KomeSomme</p>
      </div>
    </footer>
  );
}
