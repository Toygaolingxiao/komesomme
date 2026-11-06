"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/ops", label: "观测台" },
  { href: "/ops/yahoo", label: "Yahoo通販" },
  { href: "/ops/yahoo-furusato", label: "Yahoo故乡税" },
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
    <header className="border-b border-[#3d2f24] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.22em] text-[#d49a2a]">
            KOMESOMME <span className="text-[#766658]">/ OPS</span>
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#fff5e5] sm:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {children}
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full border border-[#3d2f24] px-3 py-1.5 text-xs text-[#cbb9a4] transition hover:border-[#d49a2a]/50 hover:text-[#fff5e5]"
          >
            退出
          </button>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#9a8774]">{subtitle}</p>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="观测台">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1 text-xs transition ${
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
    </header>
  );
}
