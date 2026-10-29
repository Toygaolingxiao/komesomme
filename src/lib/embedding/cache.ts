import type { EmbeddingProvider } from "./index";

/**
 * Instance-local embedding cache for the live consultation route.
 *
 * Consultation phrasings repeat heavily (the example chips alone account for
 * a large share), and each miss costs a provider round-trip before matching
 * can even start. The cache lives in module scope only: it survives across
 * requests on a warm instance, is lost on cold start, and is never shared
 * between instances. Vectors are model-scoped, so the provider is part of
 * the key — a provider switch can never serve a foreign model's vector.
 *
 * Key normalization is deliberately minimal: trim + collapse internal
 * whitespace runs. Japanese text is never lowercased or otherwise folded —
 * case folding is a Latin-script assumption and would merge distinct
 * queries (and garble katakana/romaji distinctions the matcher relies on).
 */

const MAX_ENTRIES = 200;

const cache = new Map<string, number[]>();

export function normalizeEmbeddingCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function keyFor(provider: EmbeddingProvider, text: string): string {
  return `${provider}:${normalizeEmbeddingCacheKey(text)}`;
}

export function getCachedEmbedding(
  provider: EmbeddingProvider,
  text: string
): number[] | undefined {
  const key = keyFor(provider, text);
  const hit = cache.get(key);
  if (hit) {
    // Refresh recency so hot phrasings survive eviction.
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

export function setCachedEmbedding(
  provider: EmbeddingProvider,
  text: string,
  embedding: number[]
): void {
  const key = keyFor(provider, text);
  if (cache.has(key)) cache.delete(key);
  cache.set(key, embedding);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}
