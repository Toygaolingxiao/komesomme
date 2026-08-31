"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isOpsPath } from "@/lib/ops/paths";

/** Hide public analytics / GTM chrome on the private ops surface. */
export function SkipOnOps({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isOpsPath(pathname)) return null;
  return <>{children}</>;
}
