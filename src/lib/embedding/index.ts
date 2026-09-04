import { GoogleGenAI } from "@google/genai";
import { isRetryableQuotaError, sleep } from "@/lib/gemini/modelChain";

/**
 * Provider-agnostic embedding layer (server only).
 *
 * Both supported models emit 1536 dimensions, so a single `vector(1536)` column serves
 * either provider. Vectors from different models are not comparable though, so every
 * stored row records `embedding_model` and the semantic search filters on it. Switching
 * `EMBEDDING_PROVIDER` therefore requires re-seeding before search returns results.
 */

export const EMBEDDING_DIMENSIONS = 1536;

export type EmbeddingProvider = "gemini" | "openai";

const GEMINI_MODEL = "gemini-embedding-001";
const OPENAI_MODEL = "text-embedding-3-small";

const MAX_RETRIES = 5;
const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

/**
 * Resolves the active provider.
 *
 * Explicit `EMBEDDING_PROVIDER` wins; otherwise whichever key is configured is used,
 * preferring Gemini so existing deployments keep their current behaviour.
 */
export function resolveProvider(): EmbeddingProvider {
  const configured = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();

  if (configured === "gemini" || configured === "openai") {
    return configured;
  }
  if (configured) {
    throw new Error(
      `Unsupported EMBEDDING_PROVIDER: "${configured}". Use "gemini" or "openai".`
    );
  }

  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";

  throw new Error(
    "No embedding credentials found. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local."
  );
}

export function getEmbeddingModel(provider = resolveProvider()): string {
  return provider === "openai" ? OPENAI_MODEL : GEMINI_MODEL;
}

/** Truncated MRL outputs are not unit length, so re-normalize before cosine distance. */
function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? values.map((value) => value / norm) : values;
}

function assertDimensions(values: unknown, label: string): number[] {
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    const actual = Array.isArray(values) ? values.length : 0;
    throw new Error(
      `${label}: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${actual}`
    );
  }
  return values as number[];
}

async function embedWithGemini(input: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model: GEMINI_MODEL,
    contents: input,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  const values = assertDimensions(response.embeddings?.[0]?.values, GEMINI_MODEL);
  return normalize(values);
}

async function embedWithOpenAI(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: OPENAI_MODEL, input }),
  });

  if (!response.ok) {
    throw new Error(`${OPENAI_MODEL}: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const values = assertDimensions(json.data?.[0]?.embedding, OPENAI_MODEL);
  return normalize(values);
}

export async function createEmbedding(
  input: string,
  provider = resolveProvider()
): Promise<number[]> {
  const text = input.trim();
  if (!text) {
    throw new Error("Cannot embed empty input.");
  }

  return provider === "openai" ? embedWithOpenAI(text) : embedWithGemini(text);
}

/** Live consultation: short backoff on 429. Same model only — DB vectors are model-scoped. */
export async function createEmbeddingForConsultation(
  input: string,
  provider = resolveProvider()
): Promise<number[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await createEmbedding(input, provider);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!isRetryableQuotaError(message) || attempt === 2) break;

      const retryMatch = message.match(/retry in ([\d.]+)s/i);
      const waitMs = retryMatch
        ? Math.min(Math.ceil(Number(retryMatch[1]) * 1000) + 200, 2_000)
        : 1_200;
      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Consultation embed failed");
}

/**
 * Embedding with exponential backoff for batch work such as seeding.
 *
 * Jitter keeps retries from lining up again after a shared rate-limit hit.
 */
export async function createEmbeddingWithRetry(
  input: string,
  label: string,
  provider = resolveProvider(),
  onRetry?: (message: string) => void
): Promise<number[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await createEmbedding(input, provider);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) break;

      const backoffMs = Math.min(BASE_RETRY_MS * 2 ** (attempt - 1), MAX_RETRY_MS);
      const waitMs = backoffMs + Math.floor(Math.random() * BASE_RETRY_MS);
      onRetry?.(
        `embed retry ${attempt}/${MAX_RETRIES} for "${label}": ${String(error)} (${waitMs}ms)`
      );
      await sleep(waitMs);
    }
  }

  throw new Error(
    `Failed to embed "${label}" after ${MAX_RETRIES} attempts: ${String(lastError)}`
  );
}
