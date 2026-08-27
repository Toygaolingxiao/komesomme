"use client";

import { AXIS_MAX, AXIS_MIN, getSweetnessLabel, getTextureLabel } from "@/lib/rice/matrix";
import type { TasteCoordinate } from "@/types/rice";
import { FOCUS, REGION_STYLES } from "./shared";

function ReadoutRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs text-[var(--km-muted)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--km-ink-soft)]">{description}</p>
      </div>
      <p className="font-mono text-2xl leading-none tracking-tight text-[var(--km-ink)]">
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function AxisControl({
  id,
  label,
  value,
  readout,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  readout: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs text-[var(--km-muted)]">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={AXIS_MIN}
        max={AXIS_MAX}
        step={0.04}
        value={value}
        aria-valuetext={readout}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--km-ink)]/15 accent-[var(--km-accent)] ${FOCUS}`}
      />
    </div>
  );
}

function RegionLegend() {
  return (
    <ul
      aria-label="産地域の色分け"
      className="hidden flex-wrap justify-end gap-x-3 gap-y-1.5 text-[10px] text-[var(--km-muted)] md:flex"
    >
      {REGION_STYLES.map(({ region, color }) => (
        <li key={region} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span
            aria-hidden
            className="h-2 w-2 rounded-[55%_45%_50%_50%]"
            style={{ backgroundColor: color }}
          />
          {region}
        </li>
      ))}
    </ul>
  );
}

/**
 * Sliders mirroring the probe position.
 *
 * Coordinate input only — ranking happens locally, so moving a slider never issues a
 * request.
 */
export function TasteControls({
  coordinate,
  onAxisChange,
}: {
  coordinate: TasteCoordinate;
  onAxisChange: (axis: keyof TasteCoordinate, value: number) => void;
}) {
  return (
    <section className="relative shrink-0 border-t border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-5 py-3 sm:px-7 lg:px-7 xl:px-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--km-ink)]">
          現在の味わい
        </h3>
        <RegionLegend />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--km-border)] bg-white/45 p-3">
          <ReadoutRow
            label="粒感"
            value={coordinate.hardness}
            description={getTextureLabel(coordinate.hardness)}
          />
          <div className="mt-3">
            <AxisControl
              id="km-hardness"
              label="粒感を選ぶ"
              value={coordinate.hardness}
              readout={getTextureLabel(coordinate.hardness)}
              onChange={(value) => onAxisChange("hardness", value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--km-border)] bg-white/45 p-3">
          <ReadoutRow
            label="甘み"
            value={coordinate.sweetness}
            description={getSweetnessLabel(coordinate.sweetness)}
          />
          <div className="mt-3">
            <AxisControl
              id="km-sweetness"
              label="甘みを選ぶ"
              value={coordinate.sweetness}
              readout={getSweetnessLabel(coordinate.sweetness)}
              onChange={(value) => onAxisChange("sweetness", value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
