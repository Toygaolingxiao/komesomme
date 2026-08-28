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

export type TasteMapVariant = "desktop" | "preview" | "fullscreen";

const POLES = {
  desktop: { x: 36, y: 26 },
  preview: { x: 28, y: 22 },
  fullscreen: { x: 36, y: 28 },
} as const;
const LEGEND = 28;
const SPARSE_MIN = 380;
const FOCUS_MIN = 280;

function fitPlot(availW: number, availH: number) {
  return {
    w: Math.floor(Math.max(0, availW)),
    h: Math.floor(Math.max(0, availH)),
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
      className={`self-center justify-self-center inline-flex items-center justify-center rounded-full bg-[var(--km-brown)] px-2.5 py-1 text-[10px] font-medium leading-tight text-[#fffdf7] shadow-[0_4px_12px_rgba(112,69,34,0.22)] ${
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
  variant,
  onHover,
  onToggle,
}: {
  regions: RiceRegionRecord[];
  activeId: string | null;
  variant: "wrap" | "chips";
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <ul
      aria-label="産地域の色分け"
      className={
        variant === "chips"
          ? "flex min-h-10 max-w-full items-center gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-1 py-0.5"
      }
    >
      {regions.map(({ id, name, color }) => {
        const idle = activeId !== null && activeId !== id;
        const pressed = activeId === id;
        return (
          <li key={id} className="shrink-0">
            <button
              type="button"
              aria-pressed={pressed}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(id)}
              onBlur={() => onHover(null)}
              onClick={() => onToggle(id)}
              className={`inline-flex items-center gap-1.5 rounded-full leading-tight transition ${FOCUS} ${
                idle ? "opacity-40" : "opacity-100"
              } ${
                variant === "chips"
                  ? `min-h-10 border px-3 py-2 text-[11px] ${
                      pressed
                        ? "border-[var(--km-gold)] bg-[var(--km-surface-warm)]"
                        : "border-[var(--km-border)] bg-[var(--km-surface)]"
                    }`
                  : "px-1.5 py-0.5 text-[10px]"
              }`}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full border border-white/70 shadow-[0_0_0_1px_rgba(112,69,34,0.12)]"
                style={{
                  backgroundColor: color,
                  transform: pressed ? "scale(1.25)" : "scale(1)",
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
  variant = "desktop",
  onProbeMove,
  onSelect,
  onHover,
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
  variant?: TasteMapVariant;
  onProbeMove: (hardness: number, sweetness: number) => void;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [plot, setPlot] = useState({ w: 0, h: 0 });
  const [engaged, setEngaged] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [pinnedRegion, setPinnedRegion] = useState<string | null>(null);
  const focusRegion = hoveredRegion ?? pinnedRegion;
  const pole = POLES[variant];
  const showLegend = variant !== "preview";
  const touchFriendly = variant !== "desktop";
  const showTooltip = variant === "desktop";

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const canvas = canvasRef.current;
      setPlot(
        fitPlot(
          canvas?.clientWidth || Math.max(0, stage.clientWidth - pole.x * 2),
          canvas?.clientHeight ||
            Math.max(
              0,
              stage.clientHeight -
                pole.y * 2 -
                (variant === "desktop" ? LEGEND : variant === "fullscreen" ? 44 : 0)
            )
        )
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [pole.x, pole.y, variant]);

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
    variant === "preview"
      ? "sparse"
      : variant === "fullscreen"
        ? "full"
        : shortSide > 0 && shortSide < FOCUS_MIN
          ? "focus"
          : shortSide > 0 && shortSide < SPARSE_MIN
            ? "sparse"
            : "full";
  const longPoles = variant === "fullscreen" || (variant === "desktop" && density === "full");

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
    <div ref={stageRef} className="flex h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden">
      <div
        className="grid h-full min-h-0 w-full min-w-0 max-w-full"
        style={{
          gridTemplateColumns: `${pole.x}px minmax(0,1fr) ${pole.x}px`,
          gridTemplateRows: showLegend
            ? `${pole.y}px minmax(0,1fr) ${pole.y}px auto`
            : `${pole.y}px minmax(0,1fr) ${pole.y}px`,
        }}
      >
        <div />
        <PoleCapsule label={longPoles ? AXIS_POLES.soft : AXIS_POLES.softShort} />
        <div />

        <PoleCapsule
          vertical
          label={longPoles ? AXIS_POLES.sweetLow : AXIS_POLES.sweetLowShort}
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
          className="relative min-h-0 min-w-0 w-full touch-none select-none overflow-visible rounded-[1.35rem] shadow-[0_18px_40px_-28px_rgba(112,69,34,0.45)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem] border border-[var(--km-border)]"
            style={{
              background:
                "radial-gradient(ellipse at 22% 18%, rgba(255,245,229,0.98), transparent 42%), radial-gradient(ellipse at 78% 82%, rgba(226,154,53,0.12), transparent 48%), linear-gradient(180deg, #fffdf7 0%, #fff6ea 100%)",
            }}
          >
            <MatrixGrid />
          </div>

          {loading ? (
            <MatrixSkeleton />
          ) : points.length === 0 ? (
            <EmptyPanel />
          ) : (
            <>
              {visiblePoints.map((rice) => (
                <ProfileNode
                  key={rice.id}
                  rice={rice}
                  density={density}
                  dimmed={
                    (Boolean(focusRegion) &&
                      rice.region_id !== focusRegion &&
                      rice.region !== regions.find((region) => region.id === focusRegion)?.name) ||
                    (Boolean(bestMatchId || selectedId) &&
                      rice.id !== bestMatchId &&
                      rice.id !== selectedId &&
                      !runnerUpIds.has(rice.id) &&
                      rice.id !== highlightId)
                  }
                  bestCaption={bestCaption}
                  reduceMotion={reduceMotion}
                  showTooltip={showTooltip}
                  touchFriendly={touchFriendly}
                  isBestMatch={rice.id === bestMatchId}
                  isRunnerUp={runnerUpIds.has(rice.id)}
                  isSelected={rice.id === selectedId}
                  isHighlighted={rice.id === highlightId}
                  onSelect={() => onSelect(rice.id)}
                  onHover={onHover}
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
          label={longPoles ? AXIS_POLES.sweetHigh : AXIS_POLES.sweetHighShort}
        />

        <div />
        <PoleCapsule label={longPoles ? AXIS_POLES.firm : AXIS_POLES.firmShort} />
        <div />

        {showLegend && regions.length > 0 ? (
          <div className="min-w-0 max-w-full" style={{ gridColumn: "1 / -1" }}>
            <MapLegend
              regions={regions}
              activeId={focusRegion}
              variant={variant === "fullscreen" ? "chips" : "wrap"}
              onHover={setHoveredRegion}
              onToggle={(id) => setPinnedRegion((current) => (current === id ? null : id))}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
