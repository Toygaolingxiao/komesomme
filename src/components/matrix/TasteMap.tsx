"use client";

import { useCallback, useRef, useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { motion, type MotionValue } from "motion/react";
import { positionToValue } from "@/lib/rice/matrix";
import type { RiceDisplayPoint } from "@/types/rice";
import { ProfileNode } from "./ProfileNode";
import { BAND, INSET, LAYER } from "./shared";
import { EmptyPanel, MatrixSkeleton } from "./states";

function MatrixGrid() {
  const ticks = [0, 1, 2, 3, 4];

  return (
    <div aria-hidden className="absolute inset-0" style={{ zIndex: LAYER.grid }}>
      {ticks.map((tick) => {
        const position = INSET + (tick / 4) * BAND;
        // The centre lines carry the quadrant split, so they read stronger.
        const emphasis = tick === 2 ? "bg-[var(--km-ink)]/18" : "bg-[var(--km-grid)]";

        return (
          <div key={tick}>
            <div
              className={`absolute top-0 h-full w-px ${emphasis}`}
              style={{ left: `${position}%` }}
            />
            <div
              className={`absolute left-0 h-px w-full ${emphasis}`}
              style={{ top: `${position}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function QuadrantHints() {
  const hints = [
    { className: "bottom-5 left-5", first: "やわらかく", second: "すっきり" },
    { className: "left-5 top-5", first: "やわらかく", second: "甘み豊か" },
    { className: "bottom-5 right-5 text-right", first: "粒立ちよく", second: "すっきり" },
    { className: "right-5 top-5 text-right", first: "粒立ちよく", second: "甘み豊か" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {hints.map((hint) => (
        <p
          key={`${hint.first}-${hint.second}`}
          className={`absolute max-w-24 text-[10px] leading-relaxed tracking-[0.08em] text-[var(--km-ink-soft)]/60 ${hint.className}`}
        >
          {hint.first}
          <br />
          {hint.second}
        </p>
      ))}
    </div>
  );
}

function AxisLegend({
  orientation,
  low,
  high,
  name,
}: {
  orientation: "horizontal" | "vertical";
  low: string;
  high: string;
  name: string;
}) {
  if (orientation === "vertical") {
    return (
      <div className="flex w-5 shrink-0 flex-col items-center justify-between py-1 text-[11px] text-[var(--km-muted)]">
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{high}</span>
        <span className="whitespace-nowrap font-medium text-[var(--km-ink)] [writing-mode:vertical-rl]">
          {name}
        </span>
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{low}</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--km-muted)]">
      <span>{low}</span>
      <span className="font-medium text-[var(--km-ink)]">{name}</span>
      <span>{high}</span>
    </div>
  );
}

/**
 * The tasting map: axes, quadrants, brand dots and the probe.
 *
 * X = hardness (grain definition), Y = sweetness. Pointer input reports axis values
 * upward; the parent owns the coordinate so the map stays presentational.
 */
export function TasteMap({
  points,
  bestMatchId,
  runnerUpIds,
  selectedId,
  probeLeft,
  probeTop,
  probeKey,
  interactive,
  loading,
  reduceMotion,
  onProbeMove,
  onSelect,
}: {
  points: RiceDisplayPoint[];
  bestMatchId: string | null;
  runnerUpIds: ReadonlySet<string>;
  selectedId: string | null;
  probeLeft: MotionValue<string>;
  probeTop: MotionValue<string>;
  probeKey: string;
  interactive: boolean;
  loading: boolean;
  reduceMotion: boolean;
  onProbeMove: (hardness: number, sweetness: number) => void;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [engaged, setEngaged] = useState(false);

  const moveProbe = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      onProbeMove(
        positionToValue((clientX - rect.left) / rect.width, INSET),
        positionToValue(1 - (clientY - rect.top) / rect.height, INSET)
      );
    },
    [onProbeMove]
  );

  return (
    <div className="flex gap-3 sm:gap-4">
      <AxisLegend orientation="vertical" low="すっきり" high="ふくよか" name="甘み" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={canvasRef}
          onPointerDown={(event) => {
            if (!interactive) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setEngaged(true);
            moveProbe(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (engaged) moveProbe(event.clientX, event.clientY);
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setEngaged(false);
          }}
          onPointerCancel={() => setEngaged(false)}
          className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[#f8f1e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_0_80px_rgba(185,139,50,0.06)] sm:rounded-[1.5rem]"
        >
          <MatrixGrid />
          <QuadrantHints />

          {loading ? (
            <MatrixSkeleton />
          ) : points.length === 0 ? (
            <EmptyPanel />
          ) : (
            <>
              {points.map((rice, index) => (
                <ProfileNode
                  key={rice.id}
                  rice={rice}
                  index={index}
                  reduceMotion={reduceMotion}
                  isBestMatch={rice.id === bestMatchId}
                  isRunnerUp={runnerUpIds.has(rice.id)}
                  active={rice.id === selectedId}
                  onSelect={() => onSelect(rice.id)}
                />
              ))}

              <motion.div
                aria-hidden
                style={{ left: probeLeft, top: probeTop, zIndex: LAYER.probe }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[var(--km-ink)]/[0.025] md:h-24 md:w-24">
                  <motion.span
                    key={probeKey}
                    className="absolute inset-0 rounded-full border border-[var(--km-ink)]/15"
                    animate={
                      reduceMotion || engaged
                        ? { scale: 1, opacity: 0.36 }
                        : { scale: [0.45, 2.05], opacity: [0.45, 0] }
                    }
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--km-ink)]/20 bg-[var(--km-ink)] shadow-[0_6px_18px_rgba(83,65,48,0.22)]">
                    <Drop size={10} weight="fill" className="text-[#f4dfb2]" />
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <AxisLegend orientation="horizontal" low="やわらか" high="しっかり" name="粒感" />
      </div>
    </div>
  );
}
