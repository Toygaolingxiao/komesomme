"use client";

import { motion } from "motion/react";
import type { RiceDisplayPoint } from "@/types/rice";
import { valueToPosition } from "@/lib/rice/matrix";
import {
  FOCUS,
  INSET,
  LAYER,
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

function grainShape(id: string) {
  const hash = grainHash(id);
  const tilt = (hash % 50) - 25;
  return {
    transform: `rotate(${tilt}deg)`,
    borderRadius: "50%",
  };
}

/**
 * One brand on the tasting map.
 *
 * Silhouette is a rice-grain oval, varied deterministically by id. Position still
 * comes from display coordinates; only the mark's shape and emphasis change.
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
  showTooltip = true,
  touchFriendly = false,
  onSelect,
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
  showTooltip?: boolean;
  touchFriendly?: boolean;
  onSelect: () => void;
}) {
  const featured = isBestMatch || isSelected;
  const connected = featured || isRunnerUp || isHighlighted;
  const muted = density !== "full" && !connected;
  const passThrough = muted || (touchFriendly && dimmed && !connected);
  const premium = rice.data_confidence === "high" || rice.sweetness >= 4.5;
  const baseW = touchFriendly ? 13 : 12.5;
  const baseH = touchFriendly ? 8 : 7.5;
  const grow = featured ? 1.9 : isRunnerUp || isHighlighted ? 1.35 : muted ? 0.72 : 1;
  const width = baseW * grow;
  const height = baseH * grow;
  const hit = touchFriendly
    ? featured
      ? 32
      : connected
        ? 24
        : Math.max(width, 16)
    : Math.max(width, 18);
  const left = valueToPosition(rice.display_x, INSET);
  const top = 100 - valueToPosition(rice.display_y, INSET);
  const fill = rice.region_color ?? regionColor(rice.region);
  const tags = pairTasteTags(rice);
  const shape = grainShape(rice.id);

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onSelect}
      aria-label={`${rice.name}、${rice.prefecture}、味わいを見る`}
      aria-current={isSelected || isBestMatch ? "true" : undefined}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
      animate={{
        opacity: dimmed ? 0.38 : muted ? 0.55 : connected ? 1 : 0.88,
        scale: isHighlighted && !featured ? 1.08 : 1,
      }}
      whileHover={muted || dimmed || touchFriendly ? undefined : { scale: 1.1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: hit,
        height: hit,
        ["--node-color" as string]: fill,
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
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width,
          height,
          ...shape,
          background: `radial-gradient(circle at 28% 24%, rgba(255,253,247,0.42) 0 16%, ${fill} 34%)`,
          boxShadow: featured
            ? `0 0 12px ${fill}, 0 0 26px color-mix(in srgb, ${fill} 55%, transparent)`
            : "0 0 0 1px rgba(48,40,32,0.2), 0 1px 3px rgba(112,69,34,0.18)",
        }}
      />

      {premium && !muted ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[32%] h-[18%] w-[22%] -translate-x-1/2 rounded-full bg-[#fffdf7]/80"
          style={{ transform: shape.transform }}
        />
      ) : null}

      {showTooltip ? (
        <span
          className={`pointer-events-none absolute z-10 min-w-[7.25rem] max-w-[9.5rem] rounded-lg border border-[var(--km-border)] bg-[#fffdf7] px-2.5 py-1.5 text-left shadow-[0_8px_18px_rgba(112,69,34,0.12)] transition-opacity duration-200 ${
            rice.display_y <= 1.8 ? "bottom-full mb-2.5" : "top-full mt-2.5"
          } ${
            rice.display_x <= 1.55
              ? "left-0"
              : rice.display_x >= 4.45
                ? "right-0"
                : "left-1/2 -translate-x-1/2"
          } ${
            isBestMatch || isSelected
              ? "opacity-100"
              : muted
                ? "hidden"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
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
