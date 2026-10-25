import { describe, expect, it } from "vitest";
import { splitInlineLinks } from "@/lib/editorial/inlineLinks";

describe("splitInlineLinks", () => {
  it("keeps plain memo text as one part", () => {
    expect(splitInlineLinks("出典だけの文です。")).toEqual([
      { type: "text", text: "出典だけの文です。" },
    ]);
  });

  it("splits a library link and an https source", () => {
    const source =
      "新品種『[えみほころ](/library/emihokoro)』です。（出典：埼玉県「[“えみほころ”で食欲の秋を楽しもう！](https://www.pref.saitama.lg.jp/a0314/sainokuni/sainokuni-kensei-202610p02.html)」2026年10月1日）";
    expect(splitInlineLinks(source)).toEqual([
      { type: "text", text: "新品種『" },
      { type: "link", label: "えみほころ", href: "/library/emihokoro" },
      { type: "text", text: "』です。（出典：埼玉県「" },
      {
        type: "link",
        label: "“えみほころ”で食欲の秋を楽しもう！",
        href: "https://www.pref.saitama.lg.jp/a0314/sainokuni/sainokuni-kensei-202610p02.html",
      },
      { type: "text", text: "」2026年10月1日）" },
    ]);
  });

  it("does not treat javascript or other schemes as links", () => {
    const source = "[えみほころ](javascript:alert(1))のまま";
    expect(splitInlineLinks(source)).toEqual([{ type: "text", text: source }]);
  });
});
