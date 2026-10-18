import { describe, expect, it } from "vitest";
import { artViewTransitionName } from "./artTransition";

describe("artViewTransitionName", () => {
  it("keeps brand / pair / collection names distinct and CSS-safe", () => {
    expect(artViewTransitionName("brand", "yumepirika")).toBe("km-art-brand-yumepirika");
    expect(artViewTransitionName("pair", "curry")).toBe("km-art-pair-curry");
    expect(artViewTransitionName("collection", "new-rice")).toBe(
      "km-art-collection-new-rice"
    );
    expect(artViewTransitionName("brand", "米 1!")).toBe("km-art-brand-1");
  });
});
