"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { motion, type MotionValue } from "motion/react";
import { displayXToHardness, positionToValue } from "@/lib/rice/matrix";
import type { RiceRegionRecord } from "@/lib/rice/regions";
import type { RiceDisplayPoint } from "@/types/rice";
import { ProfileNode } from "./ProfileNode";
import { INSET, LAYER } from "./shared";
import { EmptyPanel, MatrixSkeleton } from "./states";

const Y_GUTTER = 42;
const X_LABEL = 28;
const LEGEND = 42;

function MatrixGrid() {
  const ticks = [0, 1, 2, 3, 4];

  return (
    <div aria-hidden className="absolute inset-0" style={{ zIndex: LAYER.grid }}>
      {ticks.map((tick) => {
        const position = (tick / 4) * 100;
        const emphasis = tick === 2;
        const edge = tick === 0 || tick === 4;

        return (
          <div key={tick}>
            <div
              className={`absolute top-0 h-full ${
                emphasis
                  ? "w-[2px] bg-[var(--km-ink)]/22"
                  : edge
                    ? "w-px bg-[var(--km-ink)]/12"
                    : "w-px bg-[var(--km-grid)]"
              }`}
              style={{ left: `${position}%` }}
            />
            <div
              className={`absolute left-0 w-full ${
                emphasis
                  ? "h-[2px] bg-[var(--km-ink)]/22"
                  : edge
                    ? "h-px bg-[var(--km-ink)]/12"
                    : "h-px bg-[var(--km-grid)]"
              }`}
              style={{ top: `${position}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Soft washi bars through the origin — stronger poles without infographic chroma. */
function AxisBands() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: LAYER.grid }}>
      <div
        className="absolute w-[5px] -translate-x-1/2 rounded-full opacity-50"
        style={{
          left: "50%",
          top: 0,
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(196,92,26,0.28) 0%, rgba(196,92,26,0.04) 48%, rgba(20,184,166,0.22) 100%)",
        }}
      />
      <div
        className="absolute h-[5px] -translate-y-1/2 rounded-full opacity-50"
        style={{
          top: "50%",
          left: 0,
          width: "100%",
          background:
            "linear-gradient(90deg, rgba(46,134,222,0.28) 0%, rgba(245,158,11,0.08) 48%, rgba(244,63,110,0.24) 100%)",
        }}
      />
    </div>
  );
}

function MapLegend({ regions }: { regions: RiceRegionRecord[] }) {
  return (
    <ul
      aria-label="産地域の色分け"
      className="flex min-h-[42px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 py-1 text-[10px] leading-tight text-[var(--km-ink-soft)]"
    >
      {regions.map(({ id, name, color }) => (
        <li key={id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full border border-white/50 shadow-[0_0_0_1px_rgba(83,65,48,0.12)]"
            style={{ backgroundColor: color }}
          />
          {name}
        </li>
      ))}
    </ul>
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
      <div className="flex h-full w-full shrink-0 flex-col items-center justify-between py-0.5 text-[11px] text-[var(--km-muted)]">
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{high}</span>
        <span className="whitespace-nowrap font-medium tracking-wide text-[var(--km-ink)] [writing-mode:vertical-rl]">
          {name}
        </span>
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{low}</span>
      </div>
    );
  }

  return (
    <div className="flex h-7 w-full items-center justify-between px-[2%] text-[11px] text-[var(--km-muted)]">
      <span>{low}</span>
      <span className="font-medium tracking-wide text-[var(--km-ink)]">{name}</span>
      <span>{high}</span>
    </div>
  );
}

/**
 * The tasting map: axes, quadrants, brand dots and the probe.
 *
 * The plot is a measured square: side = min(remaining width, remaining height), so a
 * tall stretched left column cannot flatten the grid into a rectangle.
 */
export function TasteMap({
  points,
  regions = [],
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
  regions: RiceRegionRecord[];
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
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const next = Math.floor(
        Math.max(0, Math.min(width - Y_GUTTER, height - X_LABEL - LEGEND))
      );
      setSide(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const moveProbe = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      onProbeMove(
        displayXToHardness(positionToValue((clientX - rect.left) / rect.width, INSET)),
        positionToValue(1 - (clientY - rect.top) / rect.height, INSET)
      );
    },
    [onProbeMove]
  );

  return (
    <div ref={stageRef} className="flex h-full min-h-0 w-full items-center justify-center">
      <div
        className="grid items-stretch"
        style={{
          gridTemplateColumns: `${Y_GUTTER}px ${side || 0}px`,
          gridTemplateRows: `${side || 0}px ${X_LABEL}px auto`,
        }}
      >
        <AxisLegend orientation="vertical" low="すっきり" high="ふくよか" name="甘み" />

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
          className="relative touch-none select-none overflow-hidden rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)]"
          style={{ width: side, height: side }}
        >
          <MatrixGrid />
          <AxisBands />

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

        <div />
        <AxisLegend orientation="horizontal" low="しっかり" high="やわらか" name="粒感" />
        {regions.length > 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <MapLegend regions={regions} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
