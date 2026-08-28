"use client";

import {
  AXIS_MAX,
  AXIS_MIN,
  clamp,
  displayYToHardness,
  getSweetnessLabel,
  getTextureLabel,
  hardnessToDisplayY,
} from "@/lib/rice/matrix";
import type { TasteCoordinate } from "@/types/rice";
import { AXIS_POLES, FOCUS } from "./shared";

const NUDGES: Array<{
  label: string;
  axis: keyof TasteCoordinate;
  delta: number;
}> = [
  { label: "もっと甘みがほしい", axis: "sweetness", delta: 0.45 },
  { label: "もっと粒立ちがほしい", axis: "hardness", delta: 0.45 },
  { label: "もっと軽く食べたい", axis: "hardness", delta: -0.45 },
];

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
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-end justify-between gap-2">
        <div>
          <label htmlFor={id} className="block text-[11px] text-[var(--km-muted)]">
            {name}
          </label>
          <p className="font-serif text-[15px] font-semibold leading-tight text-[var(--km-ink)]">
            {readout}
          </p>
        </div>
        <span className="font-mono text-[9px] tabular-nums text-[var(--km-muted)]/70">
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
    <section className="relative shrink-0 border-t border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-1 pb-1.5 pt-2">
      <p className="mb-1.5 text-[10px] leading-relaxed text-[var(--km-muted)]">
        動かすと「今日の一膳」が変わります。
      </p>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
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
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {NUDGES.map((nudge) => (
          <li key={nudge.label}>
            <button
              type="button"
              onClick={() =>
                onAxisChange(nudge.axis, clamp(coordinate[nudge.axis] + nudge.delta))
              }
              className={`rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-2.5 py-1 text-[10px] text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/40 ${FOCUS}`}
            >
              {nudge.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
