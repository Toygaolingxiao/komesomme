import { afterEach, describe, expect, it } from "vitest";
import { isShareCardEnabled } from "@/lib/brand/shareCardEnabled";

describe("isShareCardEnabled", () => {
  const prevPublic = process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED;
  const prevServer = process.env.SHARE_CARD_ENABLED;

  afterEach(() => {
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED;
    else process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED = prevPublic;
    if (prevServer === undefined) delete process.env.SHARE_CARD_ENABLED;
    else process.env.SHARE_CARD_ENABLED = prevServer;
  });

  it("is on when neither flag is set", () => {
    delete process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED;
    delete process.env.SHARE_CARD_ENABLED;
    expect(isShareCardEnabled()).toBe(true);
  });

  it("turns off with NEXT_PUBLIC_SHARE_CARD_ENABLED=0", () => {
    process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED = "0";
    delete process.env.SHARE_CARD_ENABLED;
    expect(isShareCardEnabled()).toBe(false);
  });

  it("turns on with NEXT_PUBLIC_SHARE_CARD_ENABLED=1", () => {
    process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED = "1";
    delete process.env.SHARE_CARD_ENABLED;
    expect(isShareCardEnabled()).toBe(true);
  });

  it("turns on with SHARE_CARD_ENABLED=true", () => {
    delete process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED;
    process.env.SHARE_CARD_ENABLED = "true";
    expect(isShareCardEnabled()).toBe(true);
  });
});
