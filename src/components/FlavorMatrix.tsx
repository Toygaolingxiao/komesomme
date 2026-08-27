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
  hardnessToDisplayX,
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
  INSET,
  MATCH_LIMIT,
  NEIGHBOUR_LIMIT,
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
  const [semanticReply, setSemanticReply] = useState<string | null>(null);

  const probeLeft = useMotionValue(
    `${valueToPosition(hardnessToDisplayX(INITIAL_COORDINATE.hardness), INSET)}%`
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
    probeLeft.set(`${valueToPosition(hardnessToDisplayX(coordinate.hardness), INSET)}%`);
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
    setSemanticReply(null);
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
        probeLeft.set(`${valueToPosition(hardnessToDisplayX(next.hardness), INSET)}%`);
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
        reply?: string;
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
      setSemanticReply(typeof body.reply === "string" ? body.reply.trim() : null);
      setSemanticState("idle");
    } catch (cause) {
      console.error("Semantic recommend failed:", cause);
      setSemanticMatches([]);
      setSemanticReply(null);
      setSemanticState("error");
    }
  }, [query, profiles]);

  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-4 py-5 text-[var(--km-ink)] sm:px-6 sm:py-6 lg:px-8 lg:py-4">
      <div className="relative grid gap-8 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(300px,24rem)] xl:gap-10">
        <div className="relative flex h-full min-h-0 w-full flex-col">
          <div className="relative shrink-0 pb-3 pt-1">
            <h2 className="text-2xl font-semibold leading-tight tracking-tighter text-[var(--km-ink)] sm:text-3xl">
              風味マトリクス
            </h2>
            <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[var(--km-ink-soft)]">
              探針を置くと、味わいの近い銘柄が浮かび上がります。
            </p>
          </div>

          {loadState === "error" ? (
            <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
          ) : (
            <div className="relative flex min-h-[min(70vw,26rem)] flex-1 flex-col pb-2 pt-1 lg:min-h-0">
              <TasteMap
                points={points}
                regions={regions}
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

          <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
        </div>

        <aside className="flex h-full min-h-0 flex-col border-t border-[var(--km-border)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
          <RecommendationRail
            matches={railMatches}
            reply={recommendationMode === "semantic" ? semanticReply : null}
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
