import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RiceProfileV2 } from "@/types/rice";
import {
  clearRiceProfileCache,
  fetchRiceProfileById,
  getCachedRiceProfile,
} from "./fetchRiceProfile";

const PROFILE = { id: "sample-rice", name: "サンプル米" } as unknown as RiceProfileV2;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchRiceProfileById", () => {
  beforeEach(() => {
    clearRiceProfileCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches a profile and serves later reads from the cache", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(PROFILE));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchRiceProfileById("sample-rice")).resolves.toEqual(PROFILE);
    await expect(fetchRiceProfileById("sample-rice")).resolves.toEqual(PROFILE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedRiceProfile("sample-rice")).toEqual(PROFILE);
  });

  it("returns null on 404 and does not cache the failure", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ message: "銘柄が見つかりません。" }, 404)
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchRiceProfileById("missing")).resolves.toBeNull();
    await expect(fetchRiceProfileById("missing")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getCachedRiceProfile("missing")).toBeNull();
  });

  it("returns null when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    await expect(fetchRiceProfileById("sample-rice")).resolves.toBeNull();
  });

  it("rejects a body whose id does not match the request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(PROFILE)));
    await expect(fetchRiceProfileById("other-rice")).resolves.toBeNull();
    expect(getCachedRiceProfile("other-rice")).toBeNull();
  });
});
