"use client";

import {
  AXIS_MAX,
  AXIS_MIN,
  displayXToHardness,
  getSweetnessLabel,
  getTextureLabel,
  hardnessToDisplayX,
} from "@/lib/rice/matrix";
import type { TasteCoordinate } from "@/types/rice";
import { FOCUS } from "./shared";

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

export function TasteControls({
  coordinate,
  onAxisChange,
}: {
  coordinate: TasteCoordinate;
  onAxisChange: (axis: keyof TasteCoordinate, value: number) => void;
}) {
  return (
    <section className="relative shrink-0 border-t border-[var(--km-border)] px-0 py-4">
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-[var(--km-ink)]">
        現在の味わい
      </h3>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <ReadoutRow
            label="粒感"
            value={coordinate.hardness}
            description={getTextureLabel(coordinate.hardness)}
          />
          <div className="mt-3">
            <AxisControl
              id="km-hardness"
              label="粒感を選ぶ（左がしっかり）"
              value={hardnessToDisplayX(coordinate.hardness)}
              readout={getTextureLabel(coordinate.hardness)}
              onChange={(value) => onAxisChange("hardness", displayXToHardness(value))}
            />
          </div>
        </div>

        <div>
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
