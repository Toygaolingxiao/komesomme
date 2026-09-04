"use client";

import { motion } from "motion/react";
import type { RiceDisplayPoint } from "@/types/rice";
import { valueToPosition } from "@/lib/rice/matrix";
import { RiceGrainMark, type GrainEmphasis } from "./RiceGrainMark";
import {
  FOCUS,
  INSET,
  LAYER,
  mapGrainFill,
  pairTasteTags,
  regionColor,
  type MapDensity,
} from "./shared";

function grainHash(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function grainPose(id: string) {
  const hash = grainHash(id);
  // Short-grain scatter: gentle tilt + slight plumpness, not long needles.
  return {
    tilt: ((hash % 40) - 20) * 0.55,
    plump: 0.92 + (hash % 7) * 0.02,
  };
}

/**
 * One brand on the tasting map.
 *
 * Top 4 read clearly against a quieter rice cloud: No.1 largest + harvest ring,
 * runners gold-rimmed, the rest smaller and softer.
 */
export function ProfileNode({
  rice,
  isBestMatch,
  isRunnerUp,
  isSelected,
  isHighlighted,
  density,
  dimmed,
  bestCaption,
  reduceMotion,
  tooltipOpen = false,
  touchFriendly = false,
  onSelect,
  onHover,
}: {
  rice: RiceDisplayPoint;
  isBestMatch: boolean;
  isRunnerUp: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  density: MapDensity;
  dimmed: boolean;
  bestCaption: string;
  reduceMotion: boolean;
  /** Exactly one map node may show a tasting label at a time. */
  tooltipOpen?: boolean;
  touchFriendly?: boolean;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const featured = isBestMatch || isSelected;
  const connected = featured || isRunnerUp || isHighlighted;
  const muted = density !== "full" && !connected;
  const passThrough = muted || (touchFriendly && dimmed && !connected);
  const pose = grainPose(rice.id);

  const emphasis: GrainEmphasis = featured
    ? "featured"
    : isRunnerUp || isHighlighted
      ? "runner"
      : "rest";

  const baseW = (touchFriendly ? 14 : 12.5) * pose.plump;
  const baseH = (touchFriendly ? 9.5 : 8.5) * pose.plump;
  // Strong size ladder so Top 4 leave the beige cloud at a glance.
  const grow =
    featured ? 2.05 : isRunnerUp ? 1.55 : isHighlighted ? 1.4 : muted ? 0.78 : 0.92;
  const width = baseW * grow;
  const height = baseH * grow;
  const hit = touchFriendly
    ? featured
      ? 38
      : connected
        ? 30
        : Math.max(width, 16)
    : Math.max(width, featured ? 28 : connected ? 24 : 18);
  const left = valueToPosition(rice.display_x, INSET);
  const top = 100 - valueToPosition(rice.display_y, INSET);
  const fill = mapGrainFill(regionColor(rice.region_id ?? rice.region));
  const tags = pairTasteTags(rice);

  // Cloud stays readable but clearly secondary to the recommendation set.
  const restOpacity = dimmed ? 0.22 : muted ? 0.4 : 0.48;

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onSelect}
      onMouseEnter={() => onHover?.(rice.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(rice.id)}
      onBlur={() => onHover?.(null)}
      aria-label={`${rice.name}、${rice.prefecture}、味わいを見る`}
      aria-current={isSelected || isBestMatch ? "true" : undefined}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
      animate={{
        opacity: connected ? 1 : restOpacity,
        scale: isHighlighted && !featured ? 1.05 : 1,
      }}
      whileHover={muted || dimmed || touchFriendly ? undefined : { scale: 1.06 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: hit,
        height: hit,
        zIndex: isSelected || isHighlighted
          ? LAYER.selected
          : isBestMatch
            ? LAYER.bestNode
            : isRunnerUp
              ? LAYER.node + 5
              : LAYER.node,
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${FOCUS} ${
        passThrough ? "pointer-events-none" : ""
      }`}
    >
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <RiceGrainMark
          fill={fill}
          width={width}
          height={height}
          tilt={pose.tilt}
          emphasis={emphasis}
        />
      </span>

      {tooltipOpen && !muted ? (
        <span
          className={`pointer-events-none absolute z-10 min-w-[7.25rem] max-w-[9.5rem] rounded-lg border border-[var(--km-border)] bg-[#fffdf7] px-2.5 py-1.5 text-left shadow-[0_8px_18px_rgba(112,69,34,0.12)] ${
            rice.display_y <= 1.8 ? "bottom-full mb-2.5" : "top-full mt-2.5"
          } ${
            rice.display_x <= 1.55
              ? "left-0"
              : rice.display_x >= 4.45
                ? "right-0"
                : "left-1/2 -translate-x-1/2"
          }`}
        >
          {isBestMatch ? (
            <span className="block text-[9px] tracking-[0.1em] text-[var(--km-accent)]">
              {bestCaption}
            </span>
          ) : null}
          <span className="mt-0.5 block font-serif text-[13px] font-semibold leading-tight text-[var(--km-ink)]">
            {rice.name}
          </span>
          <span className="mt-0.5 block text-[10px] text-[var(--km-muted)]">
            {rice.prefecture}
          </span>
          {tags.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[var(--km-surface-warm)] px-1.5 py-0.5 text-[9px] text-[var(--km-brown)]"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
    </motion.button>
  );
}
