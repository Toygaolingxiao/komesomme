import { describe, expect, it } from "vitest";
import {
  isDailyQuotaError,
  isModelUnavailableError,
  isRetryableQuotaError,
  resolveGeminiChatModelChain,
  RETIRED_GEMINI_MODELS,
} from "./modelChain";

describe("resolveGeminiChatModelChain", () => {
  it("defaults to Flash-Lite first for consultation latency", () => {
    const chain = resolveGeminiChatModelChain();
    expect(chain[0]).toBe("gemini-3.5-flash-lite");
    expect(chain).toContain("gemini-3.5-flash");
    expect(chain).not.toContain("gemini-3.6-flash");
  });

  it("drops retired override models", () => {
    const prev = process.env.SOMMELIER_GEMINI_MODEL;
    process.env.SOMMELIER_GEMINI_MODEL = "gemini-3.6-flash";
    try {
      const chain = resolveGeminiChatModelChain();
      expect(chain).not.toContain("gemini-3.6-flash");
      expect(chain.length).toBeGreaterThan(0);
    } finally {
      if (prev === undefined) delete process.env.SOMMELIER_GEMINI_MODEL;
      else process.env.SOMMELIER_GEMINI_MODEL = prev;
    }
  });

  it("marks known retired models", () => {
    expect(RETIRED_GEMINI_MODELS.has("gemini-3.6-flash")).toBe(true);
  });
});

describe("quota error helpers", () => {
  it("detects daily quota messages", () => {
    expect(isDailyQuotaError("GenerateRequestsPerDayPerProjectPerModel-FreeTier")).toBe(true);
  });

  it("detects retryable quota", () => {
    expect(isRetryableQuotaError("429 Too Many Requests")).toBe(true);
    expect(isRetryableQuotaError("RESOURCE_EXHAUSTED")).toBe(true);
  });

  it("detects unavailable models", () => {
    expect(isModelUnavailableError("404 NOT_FOUND")).toBe(true);
  });
});
