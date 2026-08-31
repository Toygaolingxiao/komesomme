import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { opsDashboardConfigured } from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "观测台",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Private ops chrome — no public SiteHeader, no affiliate surface.
 * Secret is read in Node (not Edge middleware) so Turbopack / .env.local work.
 */
export default function OpsLayout({ children }: { children: ReactNode }) {
  if (!opsDashboardConfigured()) notFound();

  return (
    <div className="min-h-[100dvh] bg-[#241c16] text-[#f6ebdd] antialiased">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 12% 0%, rgba(212,154,42,0.18), transparent 42%), radial-gradient(ellipse at 90% 10%, rgba(229,107,63,0.12), transparent 36%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
