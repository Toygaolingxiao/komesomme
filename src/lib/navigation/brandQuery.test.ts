import { afterEach, describe, expect, it, vi } from "vitest";
import { writeBrandQuery } from "./brandQuery";

function installWindow(href: string) {
  let hrefNow = href;
  const history = {
    replaceState: vi.fn((_state: unknown, _title: string, next: string) => {
      hrefNow = new URL(next, hrefNow).href;
    }),
    pushState: vi.fn((_state: unknown, _title: string, next: string) => {
      hrefNow = new URL(next, hrefNow).href;
    }),
  };
  const location = {
    get href() {
      return hrefNow;
    },
    get pathname() {
      return new URL(hrefNow).pathname;
    },
    get search() {
      return new URL(hrefNow).search;
    },
    get hash() {
      return new URL(hrefNow).hash;
    },
  };
  vi.stubGlobal("window", { location, history });
  return history;
}

describe("writeBrandQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not touch history when the brand query is already absent", () => {
    const history = installWindow("https://komesomme.jp/");
    for (let i = 0; i < 150; i += 1) writeBrandQuery(null, "replace");
    expect(history.replaceState).toHaveBeenCalledTimes(0);
  });

  it("clears ?brand= once then no-ops", () => {
    const history = installWindow("https://komesomme.jp/?brand=yumepirika");
    writeBrandQuery(null, "replace");
    writeBrandQuery(null, "replace");
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    expect(history.replaceState.mock.calls[0]?.[2]).toBe("/");
  });

  it("pushes a brand path once for the same id", () => {
    const history = installWindow("https://komesomme.jp/");
    writeBrandQuery("yumepirika", "push");
    writeBrandQuery("yumepirika", "push");
    expect(history.pushState).toHaveBeenCalledTimes(1);
  });

  it("does not throw when history.replaceState hits a WebKit quota", () => {
    const history = installWindow("https://komesomme.jp/?brand=yumepirika");
    history.replaceState.mockImplementation(() => {
      throw new Error(
        "Attempt to use history.replaceState() more than 100 times in 30 seconds"
      );
    });
    expect(() => writeBrandQuery(null, "replace")).not.toThrow();
  });
});
