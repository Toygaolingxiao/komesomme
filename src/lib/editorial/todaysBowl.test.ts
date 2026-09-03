import { describe, expect, it } from "vitest";
import { jstDateKey, jstMonth } from "@/lib/editorial/jst";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";

const POOL = [
  { id: "a", region: "北海道・東北" },
  { id: "b", region: "北海道・東北" },
  { id: "c", region: "近畿" },
  { id: "d", region: "九州・沖縄" },
  { id: "e", region: "関東・甲信越" },
];

describe("jstDateKey", () => {
  it("formats a known UTC instant as Tokyo calendar date", () => {
    // 2026-09-02 15:30 UTC = 2026-09-03 00:30 JST
    expect(jstDateKey(Date.UTC(2026, 8, 2, 15, 30))).toBe("2026-09-03");
    expect(jstMonth(Date.UTC(2026, 8, 2, 15, 30))).toBe(9);
  });
});

describe("pickTodaysBowl", () => {
  const noonJst = Date.UTC(2026, 8, 3, 3, 0); // 12:00 JST 3 Sep

  it("returns the same three ids for the same Tokyo day", () => {
    const morning = Date.UTC(2026, 8, 2, 16, 0); // 01:00 JST 3 Sep
    const evening = Date.UTC(2026, 8, 3, 14, 0); // 23:00 JST 3 Sep
    const a = pickTodaysBowl(POOL, morning).map((row) => row.id);
    const b = pickTodaysBowl(POOL, evening).map((row) => row.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
  });

  it("changes when the Tokyo date rolls", () => {
    const day1 = pickTodaysBowl(POOL, noonJst).map((row) => row.id);
    const day2 = pickTodaysBowl(POOL, noonJst + 24 * 60 * 60 * 1000).map((row) => row.id);
    expect(day1).not.toEqual(day2);
  });

  it("prefers distinct regions before filling", () => {
    const picked = pickTodaysBowl(POOL, noonJst, 3);
    const regions = picked.map((row) => row.region);
    expect(new Set(regions).size).toBe(picked.length);
  });

  it("fills when unique regions run out", () => {
    const narrow = [
      { id: "x", region: "近畿" },
      { id: "y", region: "近畿" },
      { id: "z", region: "近畿" },
    ];
    expect(pickTodaysBowl(narrow, noonJst, 3).map((row) => row.id).sort()).toEqual(["x", "y", "z"]);
  });

  it("returns empty for an empty pool", () => {
    expect(pickTodaysBowl([], noonJst)).toEqual([]);
  });
});
