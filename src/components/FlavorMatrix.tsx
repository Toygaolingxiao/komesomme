"use client";

/**
 * FlavorMatrix orchestration.
 *
 * Layout (desktop): map + current-taste sliders on the left, recommendation rail
 * and consultation on the right. Coordinate ranking is local and instant; only
 * free-text consultation hits `/api/rice/semantic-recommend`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, useMotionValue, useReducedMotion } from "motion/react";
import { fetchRiceCatalog } from "@/lib/rice/fetchRiceProfiles";
import { RICE_REGIONS, type RiceRegionRecord } from "@/lib/rice/regions";
import {
  calculateTasteNeighbours,
  calculateTopCoordinateMatches,
  clamp,
  toDisplayPoints,
  valueToPosition,
} from "@/lib/rice/matrix";
import type {
  RecommendationMode,
  RiceProfileV2,
  TasteCoordinate,
} from "@/types/rice";
import { BrandDetailPanel } from "./matrix/BrandDetailPanel";
import { ConsultForm } from "./matrix/ConsultForm";
import { RecommendationRail } from "./matrix/RecommendationRail";
import { TasteControls } from "./matrix/TasteControls";
import { TasteMap } from "./matrix/TasteMap";
import {
  ACCENT,
  INSET,
  MATCH_LIMIT,
  NEIGHBOUR_LIMIT,
  SURFACE,
  type RailMatch,
} from "./matrix/shared";
import { ErrorPanel } from "./matrix/states";

type LoadState = "loading" | "ready" | "error";
type SemanticState = "idle" | "pending" | "error";

const INITIAL_COORDINATE: TasteCoordinate = { hardness: 3, sweetness: 3 };

export function FlavorMatrix() {
  const reduceMotion = useReducedMotion() ?? false;

  const [profiles, setProfiles] = useState<RiceProfileV2[]>([]);
  const [regions, setRegions] = useState<RiceRegionRecord[]>(RICE_REGIONS);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [coordinate, setCoordinate] = useState<TasteCoordinate>(INITIAL_COORDINATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [recommendationMode, setRecommendationMode] =
    useState<RecommendationMode>("coordinate");
  const [semanticState, setSemanticState] = useState<SemanticState>("idle");
  const [semanticMatches, setSemanticMatches] = useState<RailMatch[]>([]);

  const probeLeft = useMotionValue(
    `${valueToPosition(INITIAL_COORDINATE.hardness, INSET)}%`
  );
  const probeTop = useMotionValue(
    `${100 - valueToPosition(INITIAL_COORDINATE.sweetness, INSET)}%`
  );

  const loadProfiles = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const catalog = await fetchRiceCatalog();
      setProfiles(catalog.profiles);
      setRegions(catalog.regions);
      setLoadState("ready");
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : String(cause));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    probeLeft.set(`${valueToPosition(coordinate.hardness, INSET)}%`);
    probeTop.set(`${100 - valueToPosition(coordinate.sweetness, INSET)}%`);
  }, [coordinate.hardness, coordinate.sweetness, probeLeft, probeTop]);

  const points = useMemo(() => toDisplayPoints(profiles), [profiles]);

  const coordinateMatches = useMemo(
    () => calculateTopCoordinateMatches(points, coordinate, MATCH_LIMIT),
    [points, coordinate]
  );

  const railMatches: RailMatch[] = useMemo(() => {
    if (recommendationMode === "semantic") return semanticMatches;
    return coordinateMatches.map((match) => ({
      rice: match.rice,
      score: match.score,
      reason: match.reason,
    }));
  }, [recommendationMode, semanticMatches, coordinateMatches]);

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of coordinateMatches) {
      map.set(match.rice.id, match.score);
    }
    return map;
  }, [coordinateMatches]);

  const selected = useMemo(
    () => profiles.find((rice) => rice.id === selectedId) ?? null,
    [profiles, selectedId]
  );

  const neighbours = useMemo(
    () =>
      selected
        ? calculateTasteNeighbours(profiles, selected, NEIGHBOUR_LIMIT)
        : [],
    [profiles, selected]
  );

  const bestMatchId = coordinateMatches[0]?.rice.id ?? null;
  const runnerUpIds = useMemo(
    () => new Set(coordinateMatches.slice(1).map((match) => match.rice.id)),
    [coordinateMatches]
  );

  const resetSemantic = useCallback(() => {
    setRecommendationMode("coordinate");
    setSemanticState("idle");
    setSemanticMatches([]);
  }, []);

  const commitCoordinate = useCallback(
    (next: TasteCoordinate) => {
      setCoordinate({
        hardness: clamp(next.hardness),
        sweetness: clamp(next.sweetness),
      });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [recommendationMode, resetSemantic]
  );

  const setAxis = useCallback(
    (axis: keyof TasteCoordinate, value: number) => {
      setCoordinate((previous) => {
        const next = { ...previous, [axis]: clamp(value) };
        probeLeft.set(`${valueToPosition(next.hardness, INSET)}%`);
        probeTop.set(`${100 - valueToPosition(next.sweetness, INSET)}%`);
        return next;
      });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [probeLeft, probeTop, recommendationMode, resetSemantic]
  );

  const moveProbe = useCallback(
    (hardness: number, sweetness: number) => {
      commitCoordinate({ hardness, sweetness });
    },
    [commitCoordinate]
  );

  const runSemantic = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecommendationMode("semantic");
    setSemanticState("pending");

    try {
      const response = await fetch("/api/rice/semantic-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, matchCount: MATCH_LIMIT }),
      });

      const body = (await response.json()) as {
        matches?: Array<{ rice?: RiceProfileV2; score?: number; reason?: string }>;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message ?? "semantic recommend failed");
      }

      const matches: RailMatch[] = (body.matches ?? [])
        .map((match) => {
          const id = match.rice?.id;
          if (!id) return null;
          const rice = profiles.find((profile) => profile.id === id) ?? match.rice;
          if (!rice) return null;
          return {
            rice,
            score: typeof match.score === "number" ? match.score : 0,
            reason: match.reason ?? rice.pairing_reason,
          };
        })
        .filter((match): match is RailMatch => match !== null);

      setSemanticMatches(matches);
      setSemanticState("idle");
    } catch (cause) {
      console.error("Semantic recommend failed:", cause);
      setSemanticMatches([]);
      setSemanticState("error");
    }
  }, [query, profiles]);

  return (
    <section
      className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[1.5rem] px-3 py-5 text-[var(--km-ink)] sm:px-5 sm:py-7 lg:rounded-[2.5rem] lg:px-6 lg:py-4"
      style={{
        ["--km-accent" as string]: ACCENT,
        background:
          "radial-gradient(circle at 14% 0%, rgba(255,255,255,0.72), transparent 32%), radial-gradient(circle at 88% 82%, rgba(185,139,50,0.11), transparent 38%), linear-gradient(145deg, #f3eadb 0%, #e9dcc8 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.38'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-stretch xl:grid-cols-[minmax(0,720px)_1fr] xl:gap-6">
        <div className={`relative flex h-full w-full min-h-0 flex-col overflow-hidden ${SURFACE}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(110% 80% at 15% 0%, rgba(255,255,255,0.58), transparent 58%), radial-gradient(90% 70% at 92% 100%, rgba(185,139,50,0.08), transparent 62%)",
            }}
          />

          <div className="relative shrink-0 px-5 pt-6 sm:px-7 sm:pt-7 lg:px-7 lg:pt-5 xl:px-9 xl:pt-7">
            <h2 className="text-2xl font-semibold leading-tight tracking-tighter text-[var(--km-ink)] sm:text-3xl xl:text-4xl">
              風味マトリクス
            </h2>
            <p className="mt-2 max-w-[44ch] text-xs leading-relaxed text-[var(--km-ink-soft)] sm:text-sm">
              探針を置くと、味わいの近い銘柄が静かに浮かび上がります。
            </p>
          </div>

          {loadState === "error" ? (
            <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
          ) : (
            <div className="relative px-4 pb-4 pt-4 sm:px-7 sm:pb-5 lg:px-7 lg:pb-4 lg:pt-3 xl:px-8 xl:pb-4">
              <TasteMap
                points={points}
                bestMatchId={bestMatchId}
                runnerUpIds={runnerUpIds}
                selectedId={selectedId}
                probeLeft={probeLeft}
                probeTop={probeTop}
                probeKey={`${coordinate.hardness}-${coordinate.sweetness}`}
                interactive={loadState === "ready"}
                loading={loadState === "loading"}
                reduceMotion={reduceMotion}
                onProbeMove={moveProbe}
                onSelect={setSelectedId}
              />
            </div>
          )}

          <TasteControls coordinate={coordinate} onAxisChange={setAxis} regions={regions} />
        </div>

        <aside className="flex h-full min-h-0 flex-col divide-y divide-[var(--km-border)] rounded-[2rem] border border-[var(--km-border)] bg-[var(--km-surface)]/92 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_28px_70px_-46px_rgba(83,65,48,0.38)] sm:p-6 lg:p-5 xl:p-6">
          <RecommendationRail
            matches={railMatches}
            mode={recommendationMode}
            loading={loadState === "loading"}
            pending={semanticState === "pending"}
            selectedId={selectedId}
            reduceMotion={reduceMotion}
            onSelect={setSelectedId}
            onResetMode={resetSemantic}
          />

          <ConsultForm
            query={query}
            pending={semanticState === "pending"}
            failed={semanticState === "error"}
            onQueryChange={setQuery}
            onSubmit={() => void runSemantic()}
          />
        </aside>
      </div>

      <AnimatePresence>
        {selected ? (
          <BrandDetailPanel
            rice={selected}
            score={scoreById.get(selected.id) ?? 0}
            neighbours={neighbours}
            reduceMotion={reduceMotion}
            onSelect={setSelectedId}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default FlavorMatrix;
