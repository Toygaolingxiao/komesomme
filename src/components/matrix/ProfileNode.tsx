"use client";

import { motion } from "motion/react";
import type { RiceDisplayPoint } from "@/types/rice";
import { valueToPosition } from "@/lib/rice/matrix";
import { FOCUS, INSET, LAYER, regionColor } from "./shared";

/**
 * One brand on the tasting map.
 *
 * Dots are true circles. Size follows stickiness. The nearest match keeps its
 * region colour and is marked with a ring and standing label.
 */
export function ProfileNode({
  rice,
  index,
  isBestMatch,
  isRunnerUp,
  active,
  reduceMotion,
  onSelect,
}: {
  rice: RiceDisplayPoint;
  index: number;
  isBestMatch: boolean;
  isRunnerUp: boolean;
  active: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  const baseSize = 8 + rice.stickiness * 1.35;
  const size = isBestMatch ? baseSize + 8 : isRunnerUp ? baseSize + 3 : baseSize;

  const left = valueToPosition(rice.display_x, INSET);
  const top = 100 - valueToPosition(rice.display_y, INSET);
  const fill = rice.region_color ?? regionColor(rice.region);

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onSelect}
      aria-label={`${rice.name} ${rice.prefecture} 粒感 ${rice.hardness} 甘み ${rice.sweetness}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
      animate={{
        opacity: isBestMatch ? 1 : isRunnerUp ? 0.98 : active ? 1 : 0.94,
        scale: active && !isBestMatch ? 1.16 : 1,
      }}
      transition={{
        duration: 0.55,
        delay: reduceMotion ? 0 : Math.min(index * 0.012, 0.5),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        ["--node-color" as string]: fill,
        zIndex: isBestMatch
          ? LAYER.bestNode
          : isRunnerUp
            ? LAYER.node + 5
            : LAYER.node + (active ? 3 : 0),
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${FOCUS}`}
    >
      <span
        className={`absolute inset-0 rounded-full border transition-colors duration-500 ${
          isBestMatch
            ? "border-white/80 bg-[var(--node-color)] shadow-[0_0_0_3px_rgba(28,25,23,0.22),0_8px_18px_rgba(28,25,23,0.16)]"
            : isRunnerUp
              ? "border-white/70 bg-[var(--node-color)] shadow-[0_0_0_2px_rgba(28,25,23,0.12)]"
              : active
                ? "border-[var(--km-ink)]/35 bg-[var(--node-color)] ring-2 ring-[var(--km-ink)]/12"
                : "border-white/40 bg-[var(--node-color)] shadow-[0_0_0_1px_rgba(83,65,48,0.08)] group-hover:border-[var(--km-ink)]/30"
        }`}
      />

      {isBestMatch && !reduceMotion ? (
        <motion.span
          className="absolute inset-0 rounded-full border border-[var(--km-ink)]/25"
          animate={{ scale: [1, 2.05], opacity: [0.4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.25 }}
        />
      ) : null}

      <span
        className={`pointer-events-none absolute z-10 rounded-full border px-2.5 py-1 text-left shadow-[0_8px_20px_rgba(83,65,48,0.16)] backdrop-blur-xl transition-opacity duration-200 ${
          rice.display_y <= 1.8
            ? "bottom-full mb-2.5"
            : "top-full mt-2.5"
        } ${
          rice.display_x <= 1.55
            ? "left-0"
            : rice.display_x >= 4.45
              ? "right-0"
              : "left-1/2 -translate-x-1/2"
        } ${
          isBestMatch
            ? "border-[var(--km-accent)]/40 bg-white/96 opacity-100"
            : "border-[var(--km-border)] bg-[var(--km-surface)]/96 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
      >
        {isBestMatch ? (
          <span className="block whitespace-nowrap text-[9px] tracking-[0.08em] text-[var(--km-accent)]">
            最も近い一膳
          </span>
        ) : null}
        <span className="block whitespace-nowrap text-[9px] leading-tight text-[var(--km-muted)]">
          {rice.prefecture}
        </span>
        <span className="block whitespace-nowrap text-[11px] font-medium leading-tight tracking-tight text-[var(--km-ink)]">
          {rice.name}
        </span>
      </span>
    </motion.button>
  );
}
