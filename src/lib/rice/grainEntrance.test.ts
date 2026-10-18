import { describe, expect, it } from "vitest";
import { grainEntranceDelayMs, GRAIN_ENTER_MAX_DELAY_MS } from "./grainEntrance";

describe("grainEntranceDelayMs", () => {
  it("starts nearest the probe", () => {
    expect(
      grainEntranceDelayMs(3, 3, { hardness: 3, sweetness: 3 })
    ).toBe(0);
  });

  it("staggers farther grains later, capped at the budget", () => {
    const near = grainEntranceDelayMs(3.2, 2.8, { hardness: 3, sweetness: 3 });
    const far = grainEntranceDelayMs(1, 5, { hardness: 3, sweetness: 3 });
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
    expect(far).toBeLessThanOrEqual(GRAIN_ENTER_MAX_DELAY_MS);
  });
});
