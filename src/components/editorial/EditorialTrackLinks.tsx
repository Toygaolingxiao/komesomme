"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { TransitionLink } from "@/components/editorial/TransitionLink";

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
    <TransitionLink
      href={href}
      className={className}
      onClick={() => track("editorial_bowl_click", { id: riceId })}
    >
      {children}
    </TransitionLink>
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
    <TransitionLink
      href={href}
      className={className}
      onClick={() => track("editorial_collection_open", { slug })}
    >
      {children}
    </TransitionLink>
  );
}
