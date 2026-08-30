import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS } from "@/components/matrix/shared";

export type SiteNavActive = "map" | "library";

const NAV = [
  { id: "map" as const, href: "/", label: "味わいの地図" },
  { id: "library" as const, href: "/library", label: "ライブラリ" },
] as const;

/**
 * Shared top chrome for home and library.
 * Order is fixed; the current section is emphasized (enterprise nav pattern).
 */
export function SiteHeader({
  active,
  subtitle,
}: {
  active: SiteNavActive;
  subtitle: string;
}) {
  return (
    <header className="mx-auto flex w-full min-w-0 max-w-[1440px] shrink-0 items-center justify-between gap-2 px-4 py-2.5 sm:h-12 sm:gap-3 sm:px-5 sm:py-0">
      <Link href="/" className={`min-w-0 flex-1 ${FOCUS}`}>
        <BrandLockup subtitle={subtitle} />
      </Link>
      <div className="flex max-w-[52%] shrink-0 flex-col items-end gap-0.5">
        <nav aria-label="主要ナビ" className="flex items-center gap-3 sm:gap-4">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`font-serif text-[11px] tracking-wide transition sm:text-[12px] ${FOCUS} ${
                  isActive
                    ? "font-semibold text-[var(--km-ink)]"
                    : "text-[var(--km-muted)] hover:text-[var(--km-gold)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <SiteLegalNav />
      </div>
    </header>
  );
}
