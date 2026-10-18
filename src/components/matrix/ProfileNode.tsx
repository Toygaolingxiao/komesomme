"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { RiceDisplayPoint, TasteCoordinate } from "@/types/rice";
import {
  GRAIN_ENTER_DURATION_S,
  GRAIN_ENTER_MAX_DELAY_MS,
  GRAIN_MOTION_EASE,
  GRAIN_SCALE_DURATION_S,
  grainEntranceDelayMs,
} from "@/lib/rice/grainEntrance";
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

const FEATURED_GROW = 1.85;
const RUNNER_GROW = 1.48;
const HIGHLIGHT_GROW = 1.18;
const REST_GROW = 0.88;

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
  return {
    tilt: ((hash % 48) - 24) * 0.7,
    plump: 0.94 + (hash % 6) * 0.02,
  };
}

/**
 * One brand on the tasting map.
 *
 * Top 4: larger + glow. The rest: same grain, faded. No oval frames, no rank seals.
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
  playEntrance = false,
  probe,
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
  playEntrance?: boolean;
  probe: TasteCoordinate;
  tooltipOpen?: boolean;
  touchFriendly?: boolean;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const featured = isBestMatch || isSelected;
  const connected = featured || isRunnerUp || isHighlighted;
  const muted = density !== "full" && !connected;
  const pose = grainPose(rice.id);

  const emphasis: GrainEmphasis = featured
    ? "featured"
    : isRunnerUp || isHighlighted
      ? "runner"
      : "rest";

  const baseW = (touchFriendly ? 22 : 20) * pose.plump;
  const baseH = (touchFriendly ? 15 : 13.5) * pose.plump;
  const grow = featured
    ? FEATURED_GROW
    : isRunnerUp
      ? RUNNER_GROW
      : isHighlighted
        ? HIGHLIGHT_GROW
        : REST_GROW;
  const width = baseW * grow;
  const featuredW = baseW * FEATURED_GROW;
  const featuredH = baseH * FEATURED_GROW;
  const hit = touchFriendly
    ? featured
      ? 36
      : connected
        ? 32
        : Math.max(width + 10, 32)
    : Math.max(width + 6, featured ? 38 : connected ? 32 : 22);
  const left = valueToPosition(rice.display_x, INSET);
  const top = 100 - valueToPosition(rice.display_y, INSET);
  const fill = mapGrainFill(regionColor(rice.region_id ?? rice.region));
  const tags = pairTasteTags(rice);
  const restOpacity = dimmed ? 0.3 : muted ? 0.5 : 0.88;
  const settleBoost = reduceMotion ? 1 : featured ? 1.06 : isRunnerUp ? 1.03 : 1;
  const grainScale = (grow / FEATURED_GROW) * settleBoost;
  const enterDelay =
    playEntrance && !reduceMotion
      ? grainEntranceDelayMs(rice.display_x, rice.display_y, probe) / 1000
      : 0;
  const [staggerLive, setStaggerLive] = useState(!playEntrance || reduceMotion);

  useEffect(() => {
    if (!playEntrance || reduceMotion) return;
    const id = window.setTimeout(
      () => setStaggerLive(true),
      GRAIN_ENTER_MAX_DELAY_MS + GRAIN_ENTER_DURATION_S * 1000
    );
    return () => window.clearTimeout(id);
  }, [playEntrance, reduceMotion]);

  const enter = playEntrance && !reduceMotion && !staggerLive;

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
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: connected ? 1 : restOpacity }}
      transition={{
        duration: reduceMotion ? 0 : enter ? GRAIN_ENTER_DURATION_S : 0.22,
        delay: enter ? enterDelay : 0,
        ease: GRAIN_MOTION_EASE,
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
      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${FOCUS}`}
    >
      <motion.span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={
          reduceMotion
            ? false
            : playEntrance
              ? { scale: grainScale * 0.6 }
              : { scale: grainScale }
        }
        animate={{ scale: grainScale }}
        transition={{
          duration: reduceMotion ? 0 : enter ? GRAIN_ENTER_DURATION_S : GRAIN_SCALE_DURATION_S,
          delay: enter ? enterDelay : 0,
          ease: GRAIN_MOTION_EASE,
        }}
      >
        <RiceGrainMark
          markId={rice.id}
          fill={fill}
          width={featuredW}
          height={featuredH}
          tilt={pose.tilt}
          emphasis={emphasis}
        />
      </motion.span>

      {tooltipOpen && !muted ? (
        <span
          className={`pointer-events-none absolute z-10 min-w-[7.25rem] max-w-[9.5rem] rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] px-2.5 py-1.5 text-left shadow-[0_8px_18px_rgba(112,69,34,0.12)] ${
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
