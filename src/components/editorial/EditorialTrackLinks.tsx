"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

export function EditorialBowlLink({
  href,
  riceId,
  className,
  children,
}: {
  href: string;
  riceId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("editorial_bowl_click", { id: riceId })}
    >
      {children}
    </Link>
  );
}

export function EditorialCollectionLink({
  href,
  slug,
  className,
  children,
}: {
  href: string;
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("editorial_collection_open", { slug })}
    >
      {children}
    </Link>
  );
}
