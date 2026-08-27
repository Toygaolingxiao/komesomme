"use client";

import {
  AXIS_MAX,
  AXIS_MIN,
  displayYToHardness,
  getSweetnessLabel,
  getTextureLabel,
  hardnessToDisplayY,
} from "@/lib/rice/matrix";
import type { TasteCoordinate } from "@/types/rice";
import { AXIS_POLES, FOCUS } from "./shared";

function AxisControl({
  id,
  name,
  low,
  high,
  value,
  numeric,
  readout,
  sliderClass,
  onChange,
}: {
  id: string;
  name: string;
  low: string;
  high: string;
  value: number;
  numeric: number;
  readout: string;
  sliderClass: string;
  onChange: (value: number) => void;
}) {
  const fill = `${((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100}%`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <label htmlFor={id} className="block text-[11px] text-[var(--km-muted)]">
            {name}
          </label>
          <p className="font-serif text-[15px] font-semibold leading-tight text-[var(--km-ink)]">
            {readout}
          </p>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-[var(--km-muted)]">
          {numeric.toFixed(2)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={AXIS_MIN}
        max={AXIS_MAX}
        step={0.04}
        value={value}
        aria-valuetext={readout}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`km-slider ${sliderClass} ${FOCUS}`}
        style={{ ["--km-fill" as string]: fill }}
      />
      <div className="flex justify-between text-[10px] text-[var(--km-muted)]">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function TasteControls({
  coordinate,
  onAxisChange,
}: {
  coordinate: TasteCoordinate;
  onAxisChange: (axis: keyof TasteCoordinate, value: number) => void;
}) {
  const grainDisplay = hardnessToDisplayY(coordinate.hardness);

  return (
    <section className="relative shrink-0 rounded-b-[1.1rem] bg-[var(--km-surface-warm)]/70 px-1 pb-1 pt-3">
      <h3 className="mb-2.5 font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        現在の味わい
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <AxisControl
          id="km-hardness"
          name="粒感"
          low={AXIS_POLES.firmShort}
          high={AXIS_POLES.softShort}
          value={grainDisplay}
          numeric={coordinate.hardness}
          readout={getTextureLabel(coordinate.hardness)}
          sliderClass="km-slider-grain"
          onChange={(value) => onAxisChange("hardness", displayYToHardness(value))}
        />
        <AxisControl
          id="km-sweetness"
          name="甘み"
          low={AXIS_POLES.sweetLowShort}
          high={AXIS_POLES.sweetHighShort}
          value={coordinate.sweetness}
          numeric={coordinate.sweetness}
          readout={getSweetnessLabel(coordinate.sweetness)}
          sliderClass="km-slider-sweet"
          onChange={(value) => onAxisChange("sweetness", value)}
        />
      </div>
    </section>
  );
}
