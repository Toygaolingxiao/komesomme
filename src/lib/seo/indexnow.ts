/**
 * IndexNow payload helpers. The live key file is `public/<key>.txt`
 * (served at `/<key>.txt`). The key is public on purpose: IndexNow checks
 * ownership by fetching that file, so it is not a secret and is not read
 * from the environment.
 */

export const INDEXNOW_HOST = "komesomme.jp";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow: 8–128 chars from [A-Za-z0-9-]. */
export const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

const SITEMAP_URL = `https://${INDEXNOW_HOST}/sitemap.xml`;

export function defaultSitemapUrl(): string {
  return SITEMAP_URL;
}

export function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    locs.push(decodeXml(match[1] ?? ""));
  }
  return locs;
}

export function keyFromPublicFiles(
  files: Array<{ name: string; body: string }>,
): string {
  const keys = files.flatMap((file) => {
    if (!file.name.endsWith(".txt")) return [];
    const stem = file.name.slice(0, -".txt".length);
    if (!INDEXNOW_KEY_PATTERN.test(stem)) return [];
    if (file.body.trim() !== stem) return [];
    return [stem];
  });
  if (keys.length !== 1) {
    throw new Error(
      `Expected exactly one IndexNow key file in public/ (name and body are the key). Found ${keys.length}.`,
    );
  }
  return keys[0]!;
}

export function filterHostUrls(
  urls: string[],
  host: string = INDEXNOW_HOST,
): { ok: string[]; rejected: string[] } {
  const ok: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      rejected.push(raw);
      continue;
    }
    if (parsed.protocol !== "https:" || parsed.host !== host) {
      rejected.push(raw);
      continue;
    }
    parsed.hash = "";
    const normalized = parsed.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ok.push(normalized);
  }

  return { ok, rejected };
}

export function indexNowBody(
  key: string,
  urlList: string[],
  host: string = INDEXNOW_HOST,
): {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
} {
  if (!INDEXNOW_KEY_PATTERN.test(key)) {
    throw new Error("IndexNow key must be 8–128 characters of [A-Za-z0-9-].");
  }
  if (urlList.length === 0) {
    throw new Error("IndexNow urlList is empty.");
  }
  return {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
