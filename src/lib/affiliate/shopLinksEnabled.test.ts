import { afterEach, describe, expect, it } from "vitest";
import { isShopLinksEnabled } from "./shopLinksEnabled";

describe("isShopLinksEnabled", () => {
  const prevPublic = process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED;
  const prevServer = process.env.SHOP_LINKS_ENABLED;

  afterEach(() => {
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED;
    else process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED = prevPublic;
    if (prevServer === undefined) delete process.env.SHOP_LINKS_ENABLED;
    else process.env.SHOP_LINKS_ENABLED = prevServer;
  });

  it("defaults to on when unset", () => {
    delete process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED;
    delete process.env.SHOP_LINKS_ENABLED;
    expect(isShopLinksEnabled()).toBe(true);
  });

  it("turns off with NEXT_PUBLIC_SHOP_LINKS_ENABLED=0", () => {
    process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED = "0";
    delete process.env.SHOP_LINKS_ENABLED;
    expect(isShopLinksEnabled()).toBe(false);
  });

  it("turns off with SHOP_LINKS_ENABLED=false", () => {
    delete process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED;
    process.env.SHOP_LINKS_ENABLED = "false";
    expect(isShopLinksEnabled()).toBe(false);
  });
});
