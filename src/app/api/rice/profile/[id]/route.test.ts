import { describe, expect, it } from "vitest";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import { GET } from "./route";

function request(id: string) {
  return GET(new Request(`http://localhost/api/rice/profile/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/rice/profile/[id]", () => {
  it("returns the full catalogue profile for a known id", async () => {
    const expected = riceProfiles[0];
    const response = await request(expected.id);
    expect(response.status).toBe(200);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBe(expected.id);
    expect(body.name).toBe(expected.name);
    expect(body.prefecture).toBe(expected.prefecture);
    // Full profile, not the map projection: editorial text is present.
    expect(body.description).toBe(findRiceProfile(expected.id)?.description);
    expect(body.sommelier_note).toBe(
      findRiceProfile(expected.id)?.sommelier_note
    );
    expect(Array.isArray(body.spring_pairings)).toBe(true);
  });

  it("carries the long CDN cache header", async () => {
    const response = await request(riceProfiles[0].id);
    const cache = response.headers.get("Cache-Control") ?? "";
    expect(cache).toContain("s-maxage=86400");
    expect(cache).toContain("stale-while-revalidate=604800");
  });

  it("answers 404 for an unknown id", async () => {
    const response = await request("no-such-brand");
    expect(response.status).toBe(404);
  });
});
