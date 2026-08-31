function hostnameFromHostHeader(hostHeader: string): string {
  const first = hostHeader.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("[")) {
    const end = first.indexOf("]");
    return end > 0 ? first.slice(1, end) : first;
  }
  const colon = first.lastIndexOf(":");
  if (colon > 0 && /^\d+$/.test(first.slice(colon + 1))) {
    return first.slice(0, colon);
  }
  return first;
}

/** Hosts that must not write product analytics (operator / CI machines). */
export function isLocalAnalyticsHost(hostHeader: string | null | undefined): boolean {
  const host = (hostHeader ?? "").trim();
  if (!host) return false;
  const hostname = hostnameFromHostHeader(host);
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function requestHost(request: Request): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}
