"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
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
import { AXIS_POLES, FOCUS, ICON_WEIGHT } from "./shared";

const STEP = 0.45;

function PoleStep({
  label,
  side,
  onClick,
}: {
  label: string;
  side: "low" | "high";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}の方向へ少し動かす`}
      className={`inline-flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-[var(--km-border)] bg-[var(--km-surface)] px-1.5 font-serif text-[11px] leading-none text-[var(--km-brown)] shadow-[0_1px_2px_rgba(112,69,34,0.06)] transition hover:border-[var(--km-gold)]/50 hover:bg-[var(--km-surface-warm)] hover:text-[var(--km-ink)] active:translate-y-px ${FOCUS}`}
    >
      {side === "low" ? (
        <CaretLeft size={11} weight={ICON_WEIGHT} className="text-[var(--km-muted)]" aria-hidden />
      ) : null}
      <span>{label}</span>
      {side === "high" ? (
        <CaretRight size={11} weight={ICON_WEIGHT} className="text-[var(--km-muted)]" aria-hidden />
      ) : null}
    </button>
  );
}

function AxisControl({
  id,
  name,
  low,
  high,
  value,
  readout,
  sliderClass,
  onChange,
  onTowardLow,
  onTowardHigh,
}: {
  id: string;
  name: string;
  low: string;
  high: string;
  value: number;
  readout: string;
  sliderClass: string;
  onChange: (value: number) => void;
  onTowardLow: () => void;
  onTowardHigh: () => void;
}) {
  const fill = `${((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100}%`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div>
        <label htmlFor={id} className="block text-[11px] text-[var(--km-muted)]">
          {name}
        </label>
        <p className="font-serif text-[15px] font-semibold leading-tight text-[var(--km-ink)]">
          {readout}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <PoleStep label={low} side="low" onClick={onTowardLow} />
        <input
          id={id}
          type="range"
          min={AXIS_MIN}
          max={AXIS_MAX}
          step={0.04}
          value={value}
          aria-valuetext={readout}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`km-slider min-w-0 flex-1 ${sliderClass} ${FOCUS}`}
          style={{ ["--km-fill" as string]: fill }}
        />
        <PoleStep label={high} side="high" onClick={onTowardHigh} />
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
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        <AxisControl
          id="km-hardness"
          name="粒感"
          low={AXIS_POLES.firmShort}
          high={AXIS_POLES.softShort}
          value={grainDisplay}
          readout={getTextureLabel(coordinate.hardness)}
          sliderClass="km-slider-grain"
          onChange={(value) => onAxisChange("hardness", displayYToHardness(value))}
          onTowardLow={() =>
            onAxisChange(
              "hardness",
              displayYToHardness(clamp(grainDisplay - STEP))
            )
          }
          onTowardHigh={() =>
            onAxisChange(
              "hardness",
              displayYToHardness(clamp(grainDisplay + STEP))
            )
          }
        />
        <AxisControl
          id="km-sweetness"
          name="甘み"
          low={AXIS_POLES.sweetLowShort}
          high={AXIS_POLES.sweetHighShort}
          value={coordinate.sweetness}
          readout={getSweetnessLabel(coordinate.sweetness)}
          sliderClass="km-slider-sweet"
          onChange={(value) => onAxisChange("sweetness", value)}
          onTowardLow={() =>
            onAxisChange("sweetness", clamp(coordinate.sweetness - STEP))
          }
          onTowardHigh={() =>
            onAxisChange("sweetness", clamp(coordinate.sweetness + STEP))
          }
        />
      </div>
    </section>
  );
}
