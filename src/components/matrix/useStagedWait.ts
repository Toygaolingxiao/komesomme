"use client";

import { useEffect, useState } from "react";

/**
 * Two-stage waiting indicator: false while the wait is fresh, true once
 * `delayMs` has elapsed. Resets whenever `active` turns false and cleans
 * its timer up on unmount, so a resolved request never leaks a stage flip.
 */
export function useLateStage(active: boolean, delayMs = 6_000): boolean {
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (!active) {
      setLate(false);
      return;
    }
    setLate(false);
    const id = window.setTimeout(() => setLate(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return late;
}
