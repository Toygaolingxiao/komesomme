"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { displayYToHardness, positionToValue } from "@/lib/rice/matrix";
import type { RiceRegionRecord } from "@/lib/rice/regions";
import type { RiceDisplayPoint, TasteCoordinate } from "@/types/rice";
import { ProfileNode } from "./ProfileNode";
import { RiceGrainMark } from "./RiceGrainMark";
import { AXIS_POLES, FOCUS, INSET, LAYER, type MapDensity } from "./shared";
import { EmptyPanel, MatrixSkeleton } from "./states";

export type TasteMapVariant = "desktop" | "preview";

const POLES = {
  desktop: { x: 36, y: 26 },
  preview: { x: 28, y: 22 },
} as const;
const LEGEND = 28;
const LEGEND_CHIPS = 44;
/** Below this short side, shrink non-focus nodes (ProfileNode muted) — never cull the cloud. */
const SPARSE_MIN = 380;

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
              className={`absolute top-0 h-full ${emphasis ? "w-px" : "w-px"}`}
              style={{
                left: `${position}%`,
                background: emphasis ? "rgba(112,69,34,0.14)" : "rgba(112,69,34,0.07)",
              }}
            />
            <div
              className={`absolute left-0 w-full ${emphasis ? "h-px" : "h-px"}`}
              style={{
                top: `${position}%`,
                background: emphasis ? "rgba(112,69,34,0.14)" : "rgba(112,69,34,0.07)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Ink-style axis label — serif, no heavy pill. */
function PoleLabel({
  label,
  vertical = false,
}: {
  label: string;
  vertical?: boolean;
}) {
  return (
    <span
      className={`self-center justify-self-center font-serif text-[10px] font-medium leading-tight tracking-wide text-[var(--km-brown)] ${
        vertical
          ? "[writing-mode:vertical-rl] whitespace-nowrap"
          : "whitespace-nowrap"
      }`}
    >
      {label}
    </span>
  );
}

function MapLegend({
  regions,
  pinnedIds,
  hoveredId,
  variant,
  onHover,
  onToggle,
  onClear,
}: {
  regions: RiceRegionRecord[];
  pinnedIds: ReadonlySet<string>;
  hoveredId: string | null;
  variant: "wrap" | "chips";
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const focusIds = useMemo(() => {
    const next = new Set(pinnedIds);
    if (hoveredId) next.add(hoveredId);
    return next;
  }, [pinnedIds, hoveredId]);
  const hasFocus = focusIds.size > 0;
  const showClear = pinnedIds.size > 0;

  return (
    <div
      className={
        variant === "chips"
          ? "flex min-h-10 max-w-full items-center gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-1 py-0.5"
      }
    >
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className={`shrink-0 text-[12px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS} ${
            variant === "chips" ? "min-h-10 px-2" : "px-1.5 py-0.5"
          }`}
        >
          解除
        </button>
      ) : null}
      <ul
        aria-label="産地域の色分け"
        className={
          variant === "chips"
            ? "flex min-w-0 flex-1 items-center gap-2"
            : "contents"
        }
      >
        {regions.map(({ id, name, color }) => {
          const pressed = pinnedIds.has(id);
          const idle = hasFocus && !focusIds.has(id);
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
                className={`inline-flex items-center gap-1.5 leading-tight transition ${FOCUS} ${
                  idle ? "opacity-40" : "opacity-100"
                } ${
                  variant === "chips"
                    ? `min-h-10 border px-3 py-2 text-[12px] ${
                        pressed
                          ? "border-[var(--km-gold)]/70 bg-[var(--km-surface-warm)]"
                          : "border-[var(--km-border)] bg-[var(--km-surface)]"
                      }`
                    : `px-1.5 py-0.5 text-[12px] ${
                        pressed ? "bg-[var(--km-surface-warm)]" : ""
                      }`
                }`}
              >
                <RiceGrainMark
                  markId={`legend-${id}`}
                  fill={color}
                  width={11}
                  height={7}
                  tilt={pressed ? -6 : 8}
                />
                <span className="whitespace-nowrap text-[var(--km-ink-soft)]">{name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function regionMatches(
  rice: RiceDisplayPoint,
  regionId: string,
  regions: RiceRegionRecord[]
) {
  if (rice.region_id === regionId) return true;
  const name = regions.find((region) => region.id === regionId)?.name;
  return Boolean(name && rice.region === name);
}

/**
 * The tasting map: axes, brand grains and the probe.
 *
 * Plot size follows leftover space and a responsive aspect ratio, so wide screens
 * get a landscape map instead of a locked square.
 */
function useLgUp() {
  const [lg, setLg] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLg(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return lg;
}

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
  probeRippleKey,
  probe,
  playEntrance = false,
  interactive,
  loading,
  reduceMotion,
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
  probeLeft: MotionValue<number>;
  probeTop: MotionValue<number>;
  probeRippleKey: number;
  probe: TasteCoordinate;
  playEntrance?: boolean;
  interactive: boolean;
  loading: boolean;
  reduceMotion: boolean;
  onProbeMove: (hardness: number, sweetness: number) => void;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const lg = useLgUp();
  const variant: TasteMapVariant = lg ? "desktop" : "preview";
  const probeLeftPct = useTransform(probeLeft, (value) => `${value}%`);
  const probeTopPct = useTransform(probeTop, (value) => `${value}%`);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [plot, setPlot] = useState({ w: 0, h: 0 });
  const [engaged, setEngaged] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [pinnedRegions, setPinnedRegions] = useState<string[]>([]);
  const pinnedSet = useMemo(() => new Set(pinnedRegions), [pinnedRegions]);
  const focusSet = useMemo(() => {
    const next = new Set(pinnedSet);
    if (hoveredRegion) next.add(hoveredRegion);
    return next;
  }, [pinnedSet, hoveredRegion]);
  const pole = POLES[variant];
  const showLegend = regions.length > 0;
  const legendVariant = variant === "desktop" ? "wrap" : "chips";
  const legendReserve = variant === "desktop" ? LEGEND : LEGEND_CHIPS;
  const touchFriendly = variant !== "desktop";
  /** One tasting label at a time: hover/focus → selection → No.1. */
  const activeTooltipId = highlightId ?? selectedId ?? bestMatchId;
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
              stage.clientHeight - pole.y * 2 - (showLegend ? legendReserve : 0)
            )
        )
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [pole.x, pole.y, showLegend, legendReserve]);

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
  // Desktop one-screen layouts often measure < 280px short side. Never enter
  // "focus" (hard-cull to Top 4) — that made the home map look empty.
  // Preview uses the same short-side rule once near-square (not always sparse).
  const density: MapDensity =
    shortSide > 0 && shortSide < SPARSE_MIN ? "sparse" : "full";
  const longPoles = variant === "desktop" && density === "full";

  const toggleRegion = useCallback((id: string) => {
    setPinnedRegions((current) =>
      current.includes(id) ? current.filter((row) => row !== id) : [...current, id]
    );
  }, []);

  const clearRegions = useCallback(() => {
    setPinnedRegions([]);
    setHoveredRegion(null);
  }, []);

  return (
    <div
      ref={stageRef}
      data-taste-map={variant}
      className="flex h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden"
    >
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
        <PoleLabel label={longPoles ? AXIS_POLES.soft : AXIS_POLES.softShort} />
        <div />

        <PoleLabel
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
          className="relative min-h-0 min-w-0 w-full touch-none select-none overflow-visible rounded-[1.1rem] shadow-[0_14px_36px_-30px_rgba(112,69,34,0.4)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.1rem] border border-[var(--km-border)]"
            style={{
              background:
                "linear-gradient(180deg, var(--km-surface) 0%, color-mix(in srgb, var(--km-surface) 70%, var(--km-surface-warm)) 55%, var(--km-surface-warm) 100%)",
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
              {points.map((rice) => (
                <ProfileNode
                  key={rice.id}
                  rice={rice}
                  density={density}
                  dimmed={
                    (focusSet.size > 0 &&
                      ![...focusSet].some((id) => regionMatches(rice, id, regions))) ||
                    (rice.id !== bestMatchId &&
                      !runnerUpIds.has(rice.id) &&
                      rice.id !== selectedId &&
                      rice.id !== highlightId)
                  }
                  bestCaption={bestCaption}
                  reduceMotion={reduceMotion}
                  touchFriendly={touchFriendly}
                  isBestMatch={rice.id === bestMatchId}
                  isRunnerUp={
                    runnerUpIds.has(rice.id) && rice.id !== bestMatchId
                  }
                  isSelected={rice.id === selectedId}
                  isHighlighted={rice.id === highlightId}
                  tooltipOpen={showTooltip && rice.id === activeTooltipId}
                  onSelect={() => onSelect(rice.id)}
                  onHover={onHover}
                  playEntrance={playEntrance}
                  probe={probe}
                />
              ))}

              <motion.div
                aria-hidden
                style={{ left: probeLeftPct, top: probeTopPct, zIndex: LAYER.probe }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative grid h-11 w-11 place-items-center">
                  <motion.span
                    key={probeRippleKey}
                    className="absolute inset-0 rounded-full border border-[var(--km-gold)]/30"
                    animate={
                      reduceMotion || engaged
                        ? { scale: 1, opacity: 0.35 }
                        : { scale: [0.9, 1.35], opacity: [0.45, 0] }
                    }
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  />
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-[var(--km-brown)]/35 bg-[var(--km-brown)] shadow-[0_4px_12px_rgba(112,69,34,0.22)]">
                    <Drop size={9} weight="fill" className="text-[var(--km-surface-warm)]" />
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <PoleLabel
          vertical
          label={longPoles ? AXIS_POLES.sweetHigh : AXIS_POLES.sweetHighShort}
        />

        <div />
        <PoleLabel label={longPoles ? AXIS_POLES.firm : AXIS_POLES.firmShort} />
        <div />

        {showLegend ? (
          <div className="min-w-0 max-w-full" style={{ gridColumn: "1 / -1" }}>
            <MapLegend
              regions={regions}
              pinnedIds={pinnedSet}
              hoveredId={hoveredRegion}
              variant={legendVariant}
              onHover={setHoveredRegion}
              onToggle={toggleRegion}
              onClear={clearRegions}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
