import { describe, expect, it } from "vitest";
import { detectPrefectureStem, queryTargetsPrefecture } from "./flavorBridge";

describe("detectPrefectureStem", () => {
  it("reads a prefecture inside a Chinese recommendation", () => {
    expect(detectPrefectureStem("長崎的大米推荐")).toBe("長崎");
  });

  it("keeps 東京 when the string also contains 京都", () => {
    expect(detectPrefectureStem("東京都のお米")).toBe("東京");
    expect(detectPrefectureStem("京都の米")).toBe("京都");
  });

  it("ignores a dish that names no prefecture", () => {
    expect(detectPrefectureStem("ハイボールと唐揚げに合う米")).toBeNull();
  });
});

describe("queryTargetsPrefecture", () => {
  it("matches the catalog prefecture label", () => {
    expect(queryTargetsPrefecture("長崎の米", "長崎県")).toBe(true);
    expect(queryTargetsPrefecture("長崎の米", "佐賀県")).toBe(false);
  });
});