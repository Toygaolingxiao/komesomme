import { clamp, coordinateFromDisplayPoint } from "@/lib/rice/matrix";
import type { RiceDisplayPoint, RiceProfileV2, TasteCoordinate } from "@/types/rice";

const REQUEST_FAILURE_MESSAGE = "相談に失敗しました。しばらくしてから、もう一度お試しください。";
const RESPONSE_FAILURE_MESSAGE = "相談に失敗しました。味わいの地図から銘柄を探してみてください。";
const TIMEOUT_FAILURE_MESSAGE =
  "返事が遅かったので、いったん味わいの地図から探してみてください。";

type SemanticRecommendApiMatch = { rice?: RiceProfileV2; score?: number; reason?: string };

type SemanticRecommendResponse = {
  matches?: SemanticRecommendApiMatch[];
  reply?: string;
  message?: string;
};

export type SemanticRecommendMatch = {
  rice: RiceProfileV2;
  score: number;
  reason: string;
};

export type SemanticRecommendResult =
  | { ok: true; matches: SemanticRecommendMatch[]; reply: string | null }
  | { ok: false; message: string };

/**
 * Client-side semantic query service. Keeps fetch / timeout / response contract
 * handling out of React components so UI remains presentation-focused.
 */
export async function requestSemanticRecommend({
  query,
  matchCount,
  timeoutMs = 12_000,
  fetchImpl = fetch,
}: {
  query: string;
  matchCount: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<SemanticRecommendResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl("/api/rice/semantic-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, matchCount }),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as SemanticRecommendResponse | null;
    if (!response.ok) {
      const message =
        body && typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : RESPONSE_FAILURE_MESSAGE;
      return { ok: false, message };
    }

    if (!body) return { ok: false, message: REQUEST_FAILURE_MESSAGE };

    return {
      ok: true,
      matches: normalizeApiMatches(body.matches ?? []),
      reply: typeof body.reply === "string" ? body.reply.trim() : null,
    };
  } catch (cause) {
    const aborted =
      (typeof cause === "object" &&
        cause !== null &&
        "name" in cause &&
        (cause as { name?: string }).name === "AbortError") ||
      controller.signal.aborted;
    return {
      ok: false,
      message: aborted ? TIMEOUT_FAILURE_MESSAGE : REQUEST_FAILURE_MESSAGE,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function toSemanticRailMatches(
  matches: SemanticRecommendMatch[],
  profiles: RiceProfileV2[]
): SemanticRecommendMatch[] {
  return matches
    .map((match) => {
      const id = match.rice.id;
      if (!id) return null;
      const rice = profiles.find((profile) => profile.id === id) ?? match.rice;
      if (!rice) return null;
      return {
        rice,
        score: match.score,
        reason: match.reason ?? rice.pairing_reason,
      };
    })
    .filter((match): match is SemanticRecommendMatch => match !== null);
}

export function coordinateFromSemanticTop(
  topRice: RiceProfileV2 | null,
  points: RiceDisplayPoint[]
): TasteCoordinate | null {
  if (!topRice) return null;
  const placed = points.find((point) => point.id === topRice.id);
  if (placed) return coordinateFromDisplayPoint(placed);
  return {
    hardness: clamp(topRice.hardness),
    sweetness: clamp(topRice.sweetness),
  };
}

function normalizeApiMatches(matches: SemanticRecommendApiMatch[]): SemanticRecommendMatch[] {
  return matches
    .map((match) => {
      if (!match.rice?.id) return null;
      return {
        rice: match.rice,
        score: typeof match.score === "number" ? match.score : 0,
        reason: match.reason ?? match.rice.pairing_reason,
      };
    })
    .filter((match): match is SemanticRecommendMatch => match !== null);
}
