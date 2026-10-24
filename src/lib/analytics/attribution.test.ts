import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  captureFirstTouch,
  externalReferrer,
  parseLandingAttribution,
} from "@/lib/analytics/attribution";

function memoryStorage(initial?: string) {
  const bag = new Map<string, string>();
  if (initial !== undefined) bag.set(ATTRIBUTION_STORAGE_KEY, initial);
  return {
    getItem(key: string) {
      return bag.has(key) ? bag.get(key)! : null;
    },
    setItem(key: string, value: string) {
      bag.set(key, value);
    },
    bag,
  };
}

describe("parseLandingAttribution", () => {
  it("keeps the four utm fields and an external referrer host+path", () => {
    expect(
      parseLandingAttribution({
        search: "?utm_source=x&utm_medium=social&utm_campaign=shinmai&utm_content=card&q=ignore",
        referrer: "https://t.co/abc?secret=1",
        pageOrigin: "https://komesomme.jp",
      })
    ).toEqual({
      utm_source: "x",
      utm_medium: "social",
      utm_campaign: "shinmai",
      utm_content: "card",
      referrer: "https://t.co/abc",
    });
  });

  it("drops same-origin referrers, empty utm, and control characters", () => {
    expect(
      parseLandingAttribution({
        search: "?utm_source=%20%0A&utm_medium=",
        referrer: "https://komesomme.jp/discover?utm_source=later",
        pageOrigin: "https://komesomme.jp",
      })
    ).toEqual({});
  });

  it("truncates long tokens", () => {
    const source = "a".repeat(200);
    const parsed = parseLandingAttribution({ search: `?utm_source=${source}` });
    expect(parsed.utm_source).toHaveLength(120);
  });
});

describe("externalReferrer", () => {
  it("rejects garbage and keeps an external path", () => {
    expect(externalReferrer("not a url")).toBeUndefined();
    expect(externalReferrer("https://www.google.com/search?q=米")).toBe(
      "https://www.google.com/search"
    );
  });
});

describe("captureFirstTouch", () => {
  it("stores the landing once and ignores a later query", () => {
    const storage = memoryStorage();
    const first = captureFirstTouch(storage, {
      search: "?utm_source=newsletter&utm_medium=email",
      referrer: "https://mail.example/inbox",
      pageOrigin: "https://komesomme.jp",
    });
    const second = captureFirstTouch(storage, {
      search: "?utm_source=overwrite",
      referrer: "https://evil.example/",
      pageOrigin: "https://komesomme.jp",
    });
    expect(first).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      referrer: "https://mail.example/inbox",
    });
    expect(second).toEqual(first);
    expect(storage.bag.get(ATTRIBUTION_STORAGE_KEY)).toContain("newsletter");
  });

  it("keeps a direct visit so a later in-app referrer cannot backfill", () => {
    const storage = memoryStorage();
    expect(captureFirstTouch(storage, { search: "", referrer: "" })).toEqual({});
    expect(
      captureFirstTouch(storage, {
        search: "?utm_campaign=late",
        referrer: "https://news.example/rice",
      })
    ).toEqual({});
  });
});
