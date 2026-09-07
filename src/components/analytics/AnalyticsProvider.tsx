"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import { recordAccess } from "@/lib/analytics/accessClient";
import { isOpsPath } from "@/lib/ops/paths";

function PageViewBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams?.toString();
    const key = qs ? `${pathname}?${qs}` : pathname;
    if (!pathname || last.current === key) return;
    if (isOpsPath(pathname)) return;
    last.current = key;
    const hasQuery = Boolean(qs);
    recordAccess("page_view", {
      // Keep query out of stored path; only flag presence for funnel debug.
      has_query: hasQuery,
    });
    track("page_view", {
      page_path: pathname,
      has_query: hasQuery,
    });
  }, [pathname, searchParams]);

  return null;
}

/** Records anonymous page_view on client navigations. */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewBeacon />
      </Suspense>
      {children}
    </>
  );
}
