import { describe, expect, it } from "vitest";
import {
  getCachedEmbedding,
  normalizeEmbeddingCacheKey,
  setCachedEmbedding,
} from "./cache";

describe("embedding cache", () => {
  it("normalizes by trimming and collapsing whitespace only", () => {
    expect(normalizeEmbeddingCacheKey("  唐揚げに  合う米 ")).toBe("唐揚げに 合う米");
    expect(normalizeEmbeddingCacheKey("唐揚げに\t合う米\n")).toBe("唐揚げに 合う米");
  });

  it("never case-folds, so differently-cased queries stay distinct", () => {
    expect(normalizeEmbeddingCacheKey("Beerに合う米")).not.toBe(
      normalizeEmbeddingCacheKey("beerに合う米")
    );
  });

  it("hits for whitespace variants of the same query, per provider", () => {
    const vector = [0.1, 0.2, 0.3];
    setCachedEmbedding("gemini", "ハイボールと 唐揚げに合う米", vector);

    expect(getCachedEmbedding("gemini", " ハイボールと  唐揚げに合う米 ")).toBe(vector);
    // Vectors are model-scoped: another provider must not see this entry.
    expect(getCachedEmbedding("openai", "ハイボールと 唐揚げに合う米")).toBeUndefined();
  });

  it("evicts oldest entries beyond the cap", () => {
    for (let index = 0; index < 210; index += 1) {
      setCachedEmbedding("gemini", `質問 ${index}`, [index]);
    }
    expect(getCachedEmbedding("gemini", "質問 0")).toBeUndefined();
    expect(getCachedEmbedding("gemini", "質問 209")).toEqual([209]);
  });
});
