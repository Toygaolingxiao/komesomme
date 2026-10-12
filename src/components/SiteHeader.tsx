import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteLegalNav } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import { GUIDE_ROLE_ANNOTATED } from "@/lib/brand/guideRole";

/** Primary nav. Collection magazine pages highlight ピックアップ. */
export type SiteNavActive = "map" | "pair" | "library" | "discover";

const NAV = [
  { id: "map" as const, href: "/", label: "味わいの地図" },
  { id: "pair" as const, href: "/pair", label: "料理で選ぶ" },
  { id: "library" as const, href: "/library", label: "ライブラリ" },
  { id: "discover" as const, href: "/discover", label: "ピックアップ" },
] as const;

/**
 * Shared top chrome. Order is fixed; the current section is emphasized.
 * Page identity lives in the nav active state and the page H1 — not the lockup.
 * Omit `active` on legal / utility pages so no nav item is current.
 */
export function SiteHeader({ active }: { active?: SiteNavActive }) {
  return (
    <header
      className={`${SITE_COLUMN} flex h-12 shrink-0 items-center justify-between gap-2 sm:gap-3`}
    >
      <Link href="/" className={`min-w-0 flex-1 ${FOCUS}`}>
        <BrandLockup subtitle={GUIDE_ROLE_ANNOTATED} />
      </Link>
      <div className="flex max-w-[68%] shrink-0 flex-col items-end gap-0.5">
        <nav
          aria-label="主要ナビ"
          className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 sm:gap-x-3"
        >
          {NAV.map((item) => {
            const isActive = active != null && item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`font-serif text-[11px] tracking-wide transition-colors duration-150 ease-out active:scale-[0.97] sm:text-[12px] ${FOCUS} ${
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
