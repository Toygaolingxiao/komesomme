"use client";

import { motion } from "motion/react";
import type { RiceDisplayPoint } from "@/types/rice";
import { valueToPosition } from "@/lib/rice/matrix";
import { FOCUS, INSET, LAYER, regionColor } from "./shared";

/**
 * One brand on the tasting map.
 *
 * Dot size follows stickiness so texture is legible at a glance. The best match is
 * drawn perfectly round and gold with a permanent label; runner-ups get a weak gold
 * tint; everything else sits at reduced opacity so ~90 points stay readable.
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
  const baseSize = 9 + rice.stickiness * 1.8;
  const size = isBestMatch ? baseSize + 10 : isRunnerUp ? baseSize + 4 : baseSize;

  // Slightly irregular outlines read as grains rather than plotted data points.
  const grainShape =
    index % 3 === 0
      ? "rounded-[58%_42%_52%_48%]"
      : index % 3 === 1
        ? "rounded-[46%_54%_43%_57%]"
        : "rounded-[52%_48%_60%_40%]";

  const left = valueToPosition(rice.display_x, INSET);
  const top = 100 - valueToPosition(rice.display_y, INSET);

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onSelect}
      aria-label={`${rice.name} ${rice.prefecture} 粒感 ${rice.hardness} 甘み ${rice.sweetness}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
      animate={{
        opacity: isBestMatch ? 1 : isRunnerUp ? 0.92 : active ? 1 : 0.45,
        scale: active && !isBestMatch ? 1.18 : 1,
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
        ["--node-color" as string]: regionColor(rice.region),
        zIndex: isBestMatch
          ? LAYER.bestNode
          : isRunnerUp
            ? LAYER.node + 5
            : LAYER.node + (active ? 3 : 0),
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${FOCUS}`}
    >
      <span
        className={`absolute inset-0 border transition-colors duration-500 ${
          isBestMatch ? "rounded-full" : grainShape
        } ${
          isBestMatch
            ? "border-[#8e6822]/30 bg-[var(--km-gold-strong)] ring-2 ring-[var(--km-gold)]/30 shadow-[0_0_0_5px_rgba(185,139,50,0.10),0_8px_20px_rgba(83,65,48,0.20)]"
            : isRunnerUp
              ? "border-[var(--km-gold)]/35 bg-[var(--km-gold)]/72 ring-1 ring-[var(--km-gold)]/15"
              : active
                ? "border-[var(--km-ink)]/40 bg-[var(--node-color)] ring-2 ring-[var(--km-ink)]/15"
                : "border-[var(--km-ink)]/20 bg-[var(--node-color)] group-hover:border-[var(--km-ink)]/45 group-hover:opacity-100"
        }`}
      />

      {isBestMatch && !reduceMotion ? (
        <motion.span
          className="absolute inset-0 rounded-full border border-[var(--km-gold)]/45"
          animate={{ scale: [1, 2.05], opacity: [0.45, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.25 }}
        />
      ) : null}

      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-md border px-2.5 py-1 text-[10px] tracking-tight shadow-[0_8px_20px_rgba(83,65,48,0.16)] backdrop-blur-xl transition-opacity duration-200 ${
          isBestMatch
            ? "border-[var(--km-gold)]/35 bg-[#f2e4c8]/95 px-3 py-1.5 text-[11px] font-medium text-[var(--km-ink)] opacity-100"
            : "border-[var(--km-border)] bg-[var(--km-surface)]/95 text-[var(--km-ink)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
      >
        {isBestMatch ? `最も近い一膳｜${rice.name}` : rice.name}
      </span>
    </motion.button>
  );
}
