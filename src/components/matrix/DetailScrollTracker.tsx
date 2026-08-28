"use client";

import { useEffect, type RefObject } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires once each at 50% and 90% of a scroll root (window or a panel).
 */
export function DetailScrollTracker({
  root,
}: {
  root?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const seen = { half: false, deep: false };

    const measure = () => {
      const node = root?.current;
      let ratio = 0;
      if (node) {
        const max = node.scrollHeight - node.clientHeight;
        ratio = max <= 0 ? 1 : node.scrollTop / max;
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        ratio = max <= 0 ? 1 : window.scrollY / max;
      }

      if (!seen.half && ratio >= 0.5) {
        seen.half = true;
        track("detail_scroll_50");
      }
      if (!seen.deep && ratio >= 0.9) {
        seen.deep = true;
        track("detail_scroll_90");
      }
    };

    const target: HTMLElement | Window = root?.current ?? window;
    target.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => target.removeEventListener("scroll", measure);
  }, [root]);

  return null;
}
