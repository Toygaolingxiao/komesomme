import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterHostUrls,
  indexNowBody,
  keyFromPublicFiles,
  parseSitemapLocs,
} from "@/lib/seo/indexnow";

describe("parseSitemapLocs", () => {
  it("reads loc entries and decodes entities", () => {
    const xml = `<?xml version="1.0"?>
      <urlset>
        <url><loc>https://komesomme.jp/</loc></url>
        <url><loc>https://komesomme.jp/library/a&amp;b</loc></url>
      </urlset>`;
    expect(parseSitemapLocs(xml)).toEqual([
      "https://komesomme.jp/",
      "https://komesomme.jp/library/a&b",
    ]);
  });
});

describe("keyFromPublicFiles", () => {
  it("accepts the one file whose name and body are the key", () => {
    expect(
      keyFromPublicFiles([
        { name: "llms.txt", body: "# KomeSomme\n" },
        { name: "abcdef1234567890.txt", body: "abcdef1234567890\n" },
      ]),
    ).toBe("abcdef1234567890");
  });

  it("rejects a missing or ambiguous key", () => {
    expect(() => keyFromPublicFiles([{ name: "llms.txt", body: "llms" }])).toThrow(
      /Found 0/,
    );
    expect(() =>
      keyFromPublicFiles([
        { name: "abcdef1234567890.txt", body: "abcdef1234567890" },
        { name: "1234567890abcdef.txt", body: "1234567890abcdef" },
      ]),
    ).toThrow(/Found 2/);
  });

  it("matches the committed public key file", () => {
    const dir = path.join(process.cwd(), "public");
    const files = readdirSync(dir)
      .filter((name) => name.endsWith(".txt"))
      .map((name) => ({
        name,
        body: readFileSync(path.join(dir, name), "utf8"),
      }));
    const key = keyFromPublicFiles(files);
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe("filterHostUrls", () => {
  it("keeps https URLs on komesomme.jp and drops the rest", () => {
    const { ok, rejected } = filterHostUrls([
      "https://komesomme.jp/library/yumepirika",
      "https://komesomme.jp/library/yumepirika#cook",
      "https://www.komesomme.jp/library",
      "http://komesomme.jp/library",
      "not a url",
    ]);
    expect(ok).toEqual(["https://komesomme.jp/library/yumepirika"]);
    expect(rejected).toEqual([
      "https://www.komesomme.jp/library",
      "http://komesomme.jp/library",
      "not a url",
    ]);
  });
});

describe("indexNowBody", () => {
  it("points keyLocation at the root key file", () => {
    expect(indexNowBody("abcdef1234567890", ["https://komesomme.jp/"])).toEqual({
      host: "komesomme.jp",
      key: "abcdef1234567890",
      keyLocation: "https://komesomme.jp/abcdef1234567890.txt",
      urlList: ["https://komesomme.jp/"],
    });
  });
});
