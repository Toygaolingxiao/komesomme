import { describe, expect, it } from "vitest";
import { pairingForConsultation } from "./pairings";

describe("pairingForConsultation", () => {
  it("prefers the longest dish alias", () => {
    const hit = pairingForConsultation("スープカレーに合う米");
    expect(hit?.href).toBe("/pair/curry");
    expect(hit?.label).toBe("カレー");
    expect(hit?.top.length).toBeGreaterThan(0);
  });

  it("matches a pairing page before a vague mood would need embeddings", () => {
    const hit = pairingForConsultation("ハイボールと唐揚げに合う米");
    expect(hit?.href).toBe("/pair/karaage");
    expect(hit?.top).toHaveLength(4);
  });

  it("returns null when no dish is named", () => {
    expect(pairingForConsultation("疲れた日にやさしいご飯")).toBeNull();
  });
});