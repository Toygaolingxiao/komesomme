"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, type ComponentProps, type MouseEvent } from "react";

function hrefPath(href: ComponentProps<typeof Link>["href"]): string | null {
  if (typeof href === "string") return href;
  if (href && typeof href === "object" && typeof href.pathname === "string") {
    const search = href.search ?? "";
    const hash = href.hash ?? "";
    return `${href.pathname}${search}${hash}`;
  }
  return null;
}

function canViewTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Same as next/link, but morphs a matching `view-transition-name` when the
 * browser supports View Transitions. Modified clicks and reduced-motion skip it.
 */
export function TransitionLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    const path = hrefPath(href);
    if (!path || path.startsWith("http") || path.startsWith("mailto:")) return;
    if (!canViewTransition()) return;

    event.preventDefault();
    document.startViewTransition(() => {
      startTransition(() => {
        router.push(path);
      });
    });
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
