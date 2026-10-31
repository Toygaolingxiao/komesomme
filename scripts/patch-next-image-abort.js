/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Next.js 15.5 leaves a cold /_next/image cache key pending forever when the
 * browser cancels the request while the source file is still being read.
 * `send` / `on-finished` treats the mocked internal response as finished once
 * the caller's socket is no longer writable, and never ends that mock.
 * ResponseCache then coalesces every later request for the same url+w+q onto
 * the unsettled promise (vercel/next.js#96538, fix in #98168, not in 15.5.x).
 *
 * Keep the socket on the internal request (remoteAddress / encrypted) and
 * drop it from the internal response only.
 */
const fs = require("node:fs");
const path = require("node:path");

const MARKER = "mocked.res.socket = null;";

const FILES = [
  {
    file: "node_modules/next/dist/server/image-optimizer.js",
    needle: `        const mocked = (0, _mockrequest.createRequestResponseMocks)({
            url: href,
            method: _req.method || 'GET',
            socket: _req.socket,
            maximumResponseBody
        });
        await handleRequest(mocked.req, mocked.res, _url.default.parse(href, true));`,
    insert: `        const mocked = (0, _mockrequest.createRequestResponseMocks)({
            url: href,
            method: _req.method || 'GET',
            socket: _req.socket,
            maximumResponseBody
        });
        ${MARKER}
        await handleRequest(mocked.req, mocked.res, _url.default.parse(href, true));`,
  },
  {
    file: "node_modules/next/dist/esm/server/image-optimizer.js",
    needle: `        const mocked = createRequestResponseMocks({
            url: href,
            method: _req.method || 'GET',
            socket: _req.socket,
            maximumResponseBody
        });
        await handleRequest(mocked.req, mocked.res, nodeUrl.parse(href, true));`,
    insert: `        const mocked = createRequestResponseMocks({
            url: href,
            method: _req.method || 'GET',
            socket: _req.socket,
            maximumResponseBody
        });
        ${MARKER}
        await handleRequest(mocked.req, mocked.res, nodeUrl.parse(href, true));`,
  },
];

function patchFile(root, spec) {
  const full = path.join(root, spec.file);
  if (!fs.existsSync(full)) {
    console.log(`skip ${spec.file} (not installed)`);
    return;
  }
  const source = fs.readFileSync(full, "utf8");
  if (source.includes(MARKER)) {
    console.log(`ok ${spec.file} (already patched)`);
    return;
  }
  if (!source.includes(spec.needle)) {
    if (!source.includes("socket: _req.socket")) {
      console.log(`ok ${spec.file} (upstream no longer shares the socket)`);
      return;
    }
    throw new Error(
      `Could not patch ${spec.file}. Next's fetchInternalImage changed; update scripts/patch-next-image-abort.js.`,
    );
  }
  fs.writeFileSync(full, source.replace(spec.needle, spec.insert));
  console.log(`patched ${spec.file}`);
}

function main() {
  const root = path.resolve(__dirname, "..");
  for (const spec of FILES) patchFile(root, spec);
}

if (require.main === module) main();

module.exports = { main, MARKER };
