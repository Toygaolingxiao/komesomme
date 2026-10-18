"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOCUS } from "@/components/matrix/shared";

const TABS = [
  { href: "/", label: "地図", name: "味わいの地図", match: (path: string) => path === "/" },
  { href: "/pair", label: "料理", name: "料理で選ぶ", match: (path: string) => path.startsWith("/pair") },
  {
    href: "/library",
    label: "ライブラリ",
    name: "ライブラリ",
    match: (path: string) => path.startsWith("/library"),
  },
  {
    href: "/discover",
    label: "ピックアップ",
    name: "ピックアップ",
    match: (path: string) => path.startsWith("/discover") || path.startsWith("/collections"),
  },
] as const;

/** Phone-only primary nav. Desktop keeps the header row. */
export function MobileTabBar() {
  const path = usePathname() ?? "/";
  if (path.startsWith("/ops") || path.startsWith("/prototypes")) return null;

  return (
    <nav
      aria-label="主要ナビ"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--km-border)] bg-[var(--km-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const current = tab.match(path);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-label={tab.name}
                aria-current={current ? "page" : undefined}
                className={`flex h-12 items-center justify-center px-1 text-center font-serif text-[12px] leading-tight tracking-wide active:scale-[0.97] ${FOCUS} ${
                  current
                    ? "font-semibold text-[var(--km-ink)]"
                    : "text-[var(--km-muted)]"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
