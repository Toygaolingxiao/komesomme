import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { DiscoverMenu } from "@/components/nav/DiscoverMenu";
import { SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import { GUIDE_ROLE_ANNOTATED } from "@/lib/brand/guideRole";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import {
  collectionLatestLabel,
  collectionPublishedIso,
} from "@/lib/editorial/collections";

/** Collections for the ピックアップ dropdown, freshest first. */
const COLLECTION_MENU_ITEMS = [...EDITORIAL_COLLECTIONS]
  .sort((a, b) =>
    (collectionPublishedIso(collectionLatestLabel(b)) ?? "").localeCompare(
      collectionPublishedIso(collectionLatestLabel(a)) ?? ""
    )
  )
  .map((row) => ({ slug: row.slug, title: row.title }));

/** Primary nav. Collection magazine pages highlight ピックアップ. */
export type SiteNavActive = "map" | "pair" | "prefectures" | "compare" | "library" | "discover";

const NAV = [
  { id: "map" as const, href: "/", label: "味わいの地図" },
  { id: "pair" as const, href: "/pair", label: "料理で選ぶ" },
  { id: "prefectures" as const, href: "/prefectures", label: "産地から選ぶ" },
  { id: "compare" as const, href: "/compare", label: "銘柄くらべ" },
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
    <>
      <header
        className={`${SITE_COLUMN} flex h-12 shrink-0 items-center justify-between gap-2 sm:gap-3`}
      >
        <Link href="/" className={`min-w-0 flex-1 ${FOCUS}`}>
          <BrandLockup subtitle={GUIDE_ROLE_ANNOTATED} />
        </Link>
        <div className="hidden shrink-0 lg:flex">
          <nav
            aria-label="主要ナビ"
            className="flex items-center justify-end gap-x-3"
          >
            {NAV.map((item) => {
              const isActive = active != null && item.id === active;
              if (item.id === "discover") {
                return (
                  <DiscoverMenu
                    key={item.id}
                    active={isActive}
                    items={COLLECTION_MENU_ITEMS}
                  />
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`font-serif text-[13px] tracking-wide transition-[color,transform] duration-150 ease-out active:scale-[0.97] ${FOCUS} ${
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
        </div>
      </header>
      {/* Mobile nav: the desktop row above is hidden below lg, which left
        phones with no section links at all (owner report, 2026-11-04). */}
      <div className="border-b border-[var(--km-border)] lg:hidden">
        <nav
          aria-label="主要ナビ（モバイル）"
          className={`${SITE_COLUMN} flex gap-1 overflow-x-auto py-2`}
        >
          {NAV.map((item) => {
            const isActive = active != null && item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex-none rounded-full px-3 py-1.5 font-serif text-[13px] tracking-wide transition-transform duration-150 ease-out active:scale-[0.97] ${FOCUS} ${
                  isActive
                    ? "bg-[var(--km-surface-warm)] font-semibold text-[var(--km-ink)] ring-1 ring-[var(--km-gold)]"
                    : "text-[var(--km-muted)] ring-1 ring-[var(--km-border)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
