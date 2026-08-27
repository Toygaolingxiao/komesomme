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
  index,
  isBestMatch,
  isRunnerUp,
  isSelected,
  isHighlighted,
  density,
  dimmed,
  bestCaption,
  reduceMotion,
  onSelect,
}: {
  rice: RiceDisplayPoint;
  index: number;
  isBestMatch: boolean;
  isRunnerUp: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  density: MapDensity;
  dimmed: boolean;
  bestCaption: string;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  const featured = isBestMatch || isSelected;
  const connected = featured || isRunnerUp || isHighlighted;
  const muted = density !== "full" && !connected;
  const premium = rice.data_confidence === "high" || rice.sweetness >= 4.5;
  const ringed = rice.stickiness >= 4;
  const baseW = 16 + rice.stickiness * 1.7;
  const baseH = 8 + rice.stickiness * 0.55;
  const grow = featured ? 1.52 : isRunnerUp || isHighlighted ? 1.22 : muted ? 0.55 : 1;
  const width = baseW * grow;
  const height = baseH * grow;
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
      aria-label={`${rice.name} ${rice.prefecture} ${rice.texture_label} ${rice.sweetness_label}`}
      aria-current={isSelected || isBestMatch ? "true" : undefined}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
      animate={{
        opacity: dimmed || muted ? 0.22 : connected ? 1 : 0.48,
        scale: isHighlighted && !featured ? 1.1 : 1,
      }}
      whileHover={muted || dimmed ? undefined : { scale: 1.14 }}
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : Math.min(index * 0.01, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width,
        height,
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
        muted ? "pointer-events-none" : ""
      }`}
    >
      {featured ? (
        <span
          aria-hidden
          className="absolute -inset-[7px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(229,107,63,0.42) 0%, rgba(212,154,42,0.22) 42%, transparent 72%)",
            boxShadow: "0 0 18px rgba(229,107,63,0.28)",
          }}
        />
      ) : isRunnerUp ? (
        <span
          aria-hidden
          className="absolute -inset-1.5 rounded-full"
          style={{
            boxShadow: "0 0 0 1.5px rgba(212,154,42,0.55), 0 0 10px rgba(212,154,42,0.22)",
          }}
        />
      ) : null}

      <span
        className="absolute inset-0"
        style={{
          ...shape,
          background: featured
            ? `radial-gradient(circle at 32% 28%, #fffdf7 0 18%, #e56b3f 28% 58%, ${fill} 72%)`
            : `radial-gradient(circle at 30% 26%, rgba(255,253,247,0.72) 0 22%, var(--node-color) 38%)`,
          boxShadow: featured
            ? "0 0 0 2px #fffdf7, 0 0 0 4px rgba(212,154,42,0.7), 0 8px 16px rgba(112,69,34,0.22)"
            : isRunnerUp
              ? `0 0 0 1.5px #fffdf7, 0 0 0 3px rgba(212,154,42,0.55), 0 3px 8px rgba(112,69,34,0.16)`
              : ringed
                ? `0 0 0 1.5px #fffdf7, 0 0 0 3px ${fill}, 0 3px 8px rgba(112,69,34,0.16)`
                : "0 0 0 1.5px #fffdf7, 0 2px 5px rgba(112,69,34,0.18)",
        }}
      />

      {premium && !muted ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-[22%] top-[18%] h-[28%] w-[38%] rounded-full bg-[#fffdf7]/80"
          style={{ transform: shape.transform }}
        />
      ) : null}

      <span
        className={`pointer-events-none absolute z-10 min-w-[7.25rem] max-w-[9.5rem] rounded-xl border px-2.5 py-1.5 text-left shadow-[0_10px_24px_rgba(112,69,34,0.16)] transition-opacity duration-200 ${
          rice.display_y <= 1.8 ? "bottom-full mb-2.5" : "top-full mt-2.5"
        } ${
          rice.display_x <= 1.55
            ? "left-0"
            : rice.display_x >= 4.45
              ? "right-0"
              : "left-1/2 -translate-x-1/2"
        } ${
          isBestMatch
            ? "border-[#e29a35]/45 bg-[#fffdf7] opacity-100"
            : muted
              ? "hidden"
              : "border-[var(--km-border)] bg-[#fffdf7]/96 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
        style={{ borderTopWidth: 3, borderTopColor: fill }}
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
    </motion.button>
  );
}
