"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/ops", label: "观测台" },
  { href: "/ops/yahoo", label: "Yahoo推广链" },
] as const;

export function OpsChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/ops/logout", { method: "POST" });
    router.replace("/ops/login");
    router.refresh();
  }

  return (
    <header className="flex flex-col gap-4 border-b border-[#3d2f24] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-[#d49a2a]">KOMESOMME</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#fff5e5] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#cbb9a4]">{subtitle}</p>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="观测台">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-[#e56b3f] font-semibold text-[#fffdf7]"
                    : "border border-[#3d2f24] text-[#cbb9a4] hover:text-[#fff5e5]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-full border border-[#3d2f24] px-3 py-1.5 text-xs text-[#cbb9a4] transition hover:border-[#d49a2a]/50 hover:text-[#fff5e5]"
        >
          退出
        </button>
      </div>
    </header>
  );
}
