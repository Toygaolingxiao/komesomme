"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, onStoreChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

/** SSR / first paint: mobile-first so desktop markup is not dual-mounted. */
function getServerSnapshot() {
  return false;
}

/**
 * Live `window.matchMedia` result. Server and hydration assume `false`
 * (mobile-first); the client re-reads after hydrate.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    getServerSnapshot
  );
}
