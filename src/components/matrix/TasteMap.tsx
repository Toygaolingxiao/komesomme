"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { motion, type MotionValue } from "motion/react";
import { displayYToHardness, positionToValue } from "@/lib/rice/matrix";
import type { RiceRegionRecord } from "@/lib/rice/regions";
import type { RiceDisplayPoint } from "@/types/rice";
import { ProfileNode } from "./ProfileNode";
import { AXIS_POLES, FOCUS, INSET, LAYER, type MapDensity } from "./shared";
import { EmptyPanel, MatrixSkeleton } from "./states";

const POLE_X = 52;
const POLE_Y = 30;
const LEGEND = 34;
const SPARSE_MIN = 380;
const FOCUS_MIN = 280;

function fitPlot(availW: number, availH: number) {
  const width = Math.max(0, availW);
  const height = Math.max(0, availH);
  const ratio = width < 480 ? 5 / 6 : width < 720 ? 4 / 3 : 16 / 10;
  let plotW = width;
  let plotH = plotW / ratio;
  if (plotH > height) {
    plotH = height;
    plotW = plotH * ratio;
  }
  return {
    w: Math.floor(plotW),
    h: Math.floor(plotH),
  };
}

function MatrixGrid() {
  const ticks = [0, 2, 4];

  return (
    <div aria-hidden className="absolute inset-0" style={{ zIndex: LAYER.grid }}>
      {ticks.map((tick) => {
        const position = (tick / 4) * 100;
        const emphasis = tick === 2;

        return (
          <div key={tick}>
            <div
              className={`absolute top-0 h-full ${emphasis ? "w-[2px]" : "w-px"}`}
              style={{
                left: `${position}%`,
                background: emphasis ? "var(--km-cross)" : "rgba(112,69,34,0.1)",
              }}
            />
            <div
              className={`absolute left-0 w-full ${emphasis ? "h-[2px]" : "h-px"}`}
              style={{
                top: `${position}%`,
                background: emphasis ? "var(--km-cross)" : "rgba(112,69,34,0.1)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function PoleCapsule({
  label,
  vertical = false,
}: {
  label: string;
  vertical?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[var(--km-brown)] px-2.5 py-1 text-[10px] font-medium leading-tight text-[#fffdf7] shadow-[0_4px_12px_rgba(112,69,34,0.22)] ${
        vertical
          ? "[writing-mode:vertical-rl] whitespace-nowrap px-1.5 py-2.5"
          : "whitespace-nowrap"
      }`}
    >
      {label}
    </span>
  );
}

function MapLegend({
  regions,
  activeId,
  onHover,
  onToggle,
}: {
  regions: RiceRegionRecord[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <ul
      aria-label="産地域の色分け"
      className="flex min-h-[32px] flex-wrap items-center justify-center gap-x-1 gap-y-1 px-1 py-0.5"
    >
      {regions.map(({ id, name, color }) => {
        const idle = activeId !== null && activeId !== id;
        return (
          <li key={id}>
            <button
              type="button"
              aria-pressed={activeId === id}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(id)}
              onBlur={() => onHover(null)}
              onClick={() => onToggle(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-tight transition ${FOCUS} ${
                idle ? "opacity-40" : "opacity-100"
              }`}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full border border-white/70 shadow-[0_0_0_1px_rgba(112,69,34,0.12)]"
                style={{
                  backgroundColor: color,
                  transform: activeId === id ? "scale(1.25)" : "scale(1)",
                }}
              />
              <span className="whitespace-nowrap text-[var(--km-ink-soft)]">{name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The tasting map: axes, brand grains and the probe.
 *
 * Plot size follows leftover space and a responsive aspect ratio, so wide screens
 * get a landscape map instead of a locked square.
 */
export function TasteMap({
  points,
  regions = [],
  bestMatchId,
  runnerUpIds,
  selectedId,
  highlightId,
  bestCaption,
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
  highlightId?: string | null;
  bestCaption: string;
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
  const [plot, setPlot] = useState({ w: 0, h: 0 });
  const [engaged, setEngaged] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [pinnedRegion, setPinnedRegion] = useState<string | null>(null);
  const focusRegion = hoveredRegion ?? pinnedRegion;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      setPlot(
        fitPlot(stage.clientWidth - POLE_X * 2, stage.clientHeight - POLE_Y * 2 - LEGEND)
      );
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
        displayYToHardness(positionToValue(1 - (clientY - rect.top) / rect.height, INSET)),
        positionToValue((clientX - rect.left) / rect.width, INSET)
      );
    },
    [onProbeMove]
  );

  const shortSide = Math.min(plot.w, plot.h);
  const density: MapDensity =
    shortSide > 0 && shortSide < FOCUS_MIN
      ? "focus"
      : shortSide > 0 && shortSide < SPARSE_MIN
        ? "sparse"
        : "full";
  const compactPoles = density !== "full";

  const visiblePoints =
    density === "focus" && (bestMatchId || selectedId)
      ? points.filter(
          (rice) =>
            rice.id === bestMatchId ||
            runnerUpIds.has(rice.id) ||
            rice.id === selectedId
        )
      : points;

  return (
    <div ref={stageRef} className="flex h-full min-h-0 w-full items-center justify-center">
      <div
        className="grid items-center justify-items-center"
        style={{
          gridTemplateColumns: `${POLE_X}px ${plot.w || 0}px ${POLE_X}px`,
          gridTemplateRows: `${POLE_Y}px ${plot.h || 0}px ${POLE_Y}px auto`,
        }}
      >
        <div />
        <PoleCapsule label={compactPoles ? AXIS_POLES.softShort : AXIS_POLES.soft} />
        <div />

        <PoleCapsule
          vertical
          label={compactPoles ? AXIS_POLES.sweetLowShort : AXIS_POLES.sweetLow}
        />

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
          className="relative touch-none select-none overflow-visible rounded-[1.35rem] border border-[var(--km-border)] shadow-[0_18px_40px_-28px_rgba(112,69,34,0.45)]"
          style={{
            width: plot.w,
            height: plot.h,
            background:
              "radial-gradient(ellipse at 22% 18%, rgba(255,245,229,0.98), transparent 42%), radial-gradient(ellipse at 78% 82%, rgba(226,154,53,0.12), transparent 48%), linear-gradient(180deg, #fffdf7 0%, #fff6ea 100%)",
          }}
        >
          <MatrixGrid />

          {loading ? (
            <MatrixSkeleton />
          ) : points.length === 0 ? (
            <EmptyPanel />
          ) : (
            <>
              {visiblePoints.map((rice, index) => (
                <ProfileNode
                  key={rice.id}
                  rice={rice}
                  index={index}
                  density={density}
                  dimmed={
                    Boolean(focusRegion) &&
                    rice.region_id !== focusRegion &&
                    rice.region !== regions.find((region) => region.id === focusRegion)?.name
                  }
                  bestCaption={bestCaption}
                  reduceMotion={reduceMotion}
                  isBestMatch={rice.id === bestMatchId}
                  isRunnerUp={runnerUpIds.has(rice.id)}
                  isSelected={rice.id === selectedId}
                  isHighlighted={rice.id === highlightId}
                  onSelect={() => onSelect(rice.id)}
                />
              ))}

              <motion.div
                aria-hidden
                style={{ left: probeLeft, top: probeTop, zIndex: LAYER.probe }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative grid h-11 w-11 place-items-center">
                  <motion.span
                    key={probeKey}
                    className="absolute inset-0 rounded-full border border-[var(--km-gold)]/40"
                    animate={
                      reduceMotion || engaged
                        ? { scale: 1, opacity: 0.4 }
                        : { scale: [0.5, 1.7], opacity: [0.45, 0] }
                    }
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-[#704522]/40 bg-[var(--km-brown)] shadow-[0_6px_16px_rgba(112,69,34,0.28)]">
                    <Drop size={10} weight="fill" className="text-[#fff5e5]" />
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <PoleCapsule
          vertical
          label={compactPoles ? AXIS_POLES.sweetHighShort : AXIS_POLES.sweetHigh}
        />

        <div />
        <PoleCapsule label={compactPoles ? AXIS_POLES.firmShort : AXIS_POLES.firm} />
        <div />

        {regions.length > 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <MapLegend
              regions={regions}
              activeId={focusRegion}
              onHover={setHoveredRegion}
              onToggle={(id) => setPinnedRegion((current) => (current === id ? null : id))}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
