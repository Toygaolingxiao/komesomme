import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Next 15.5.x has no release with vercel/next.js#98168. `npm ci` applies
 * scripts/patch-next-image-abort.js so a cancelled cold /_next/image cannot
 * wedge that cache key for the rest of the process.
 */
describe("next image abort patch", () => {
  it("clears the caller socket on the internal image response before serve", () => {
    execFileSync(process.execPath, ["scripts/patch-next-image-abort.js"], {
      cwd: process.cwd(),
    });

    for (const file of [
      "node_modules/next/dist/server/image-optimizer.js",
      "node_modules/next/dist/esm/server/image-optimizer.js",
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      const fetchAt = source.indexOf("function fetchInternalImage");
      const socketNull = source.indexOf("mocked.res.socket = null;", fetchAt);
      const handle = source.indexOf("await handleRequest", fetchAt);
      expect(fetchAt).toBeGreaterThan(-1);
      expect(socketNull).toBeGreaterThan(fetchAt);
      expect(handle).toBeGreaterThan(socketNull);
    }
  });
});
