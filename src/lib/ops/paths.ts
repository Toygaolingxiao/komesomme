/** Path helpers safe for Client Components (no env, no crypto). */

export function isOpsPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname && (pathname === "/ops" || pathname.startsWith("/ops/")));
}

/** Login `next` must be the dashboard root — no open redirects, no `..`. */
export function isSafeOpsNextPath(next: string | null | undefined): next is "/ops" {
  return next === "/ops";
}
