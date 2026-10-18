import { describe, expect, it } from "vitest";
import { joinClauses } from "./joinClauses";

describe("joinClauses", () => {
  it("does not insert a comma after a full stop", () => {
    expect(joinClauses(["合わせやすいです。", "具だくさんの日に。"])).toBe(
      "合わせやすいです。具だくさんの日に。",
    );
  });

  it("keeps a comma between bare phrases", () => {
    expect(joinClauses(["カレー", "丼もの"])).toBe("カレー、丼もの");
  });
});
