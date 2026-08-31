import { describe, expect, it } from "vitest";
import { isLocalAnalyticsHost } from "@/lib/analytics/recordPolicy";

describe("isLocalAnalyticsHost", () => {
  it("treats localhost and loopback as local", () => {
    expect(isLocalAnalyticsHost("localhost:3001")).toBe(true);
    expect(isLocalAnalyticsHost("127.0.0.1:3000")).toBe(true);
    expect(isLocalAnalyticsHost("[::1]:3000")).toBe(true);
  });

  it("treats production hosts as remote", () => {
    expect(isLocalAnalyticsHost("komesomme.jp")).toBe(false);
    expect(isLocalAnalyticsHost("www.komesomme.jp")).toBe(false);
  });
});
