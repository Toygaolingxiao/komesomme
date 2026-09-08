import { expect, test } from "@playwright/test";
import { STABLE_BRAND_ID } from "./helpers";

test("TS-SEO-01 sitemap lists home and library brand", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();
  expect(xml).toContain("<url>");
  expect(xml).toMatch(/\/library\/yumepirika/);
});

test("TS-SEO-02 robots points to sitemap and blocks api", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text.toLowerCase()).toContain("sitemap");
  expect(text).toMatch(/disallow:\s*\/api/i);
});

test("TS-SEO-03 brand page carries Article and BreadcrumbList JSON-LD", async ({ request }) => {
  const html = await (await request.get(`/library/${STABLE_BRAND_ID}`)).text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
    (match) => JSON.parse(match[1]!) as unknown
  );
  const types = blocks
    .flatMap((block) => (Array.isArray(block) ? block : [block]))
    .map((node) => (node as { "@type"?: string })["@type"]);

  expect(types).toContain("Article");
  expect(types).toContain("BreadcrumbList");
  expect(types).toContain("WebSite");
});

test("TS-SEO-04 large image previews are allowed and OG image is per brand", async ({
  request,
}) => {
  const html = await (await request.get(`/library/${STABLE_BRAND_ID}`)).text();
  expect(html).toMatch(/name="robots"[^>]*max-image-preview:large/);
  expect(html).toMatch(
    new RegExp(`og:image"\\s+content="[^"]*/library/${STABLE_BRAND_ID}/opengraph-image`)
  );
});

test("TS-SEO-05 brand OG image renders at 1200x630", async ({ request }) => {
  const response = await request.get(`/library/${STABLE_BRAND_ID}/opengraph-image`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/png");
  // PNG IHDR: width and height are big-endian uint32 at byte 16 and 20.
  const png = await response.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("TS-SEO-06 brand page shows a breadcrumb trail", async ({ page }) => {
  await page.goto(`/library/${STABLE_BRAND_ID}`);
  const trail = page.getByRole("navigation", { name: "現在の位置" });
  await expect(trail.getByRole("link", { name: "銘柄ライブラリ" })).toBeVisible();
});

test("TS-SEC-01 security headers on document", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const headers = response.headers();
  expect(headers["x-content-type-options"]?.toLowerCase()).toBe("nosniff");
  expect(headers["x-frame-options"]?.toUpperCase()).toMatch(/SAMEORIGIN|DENY/);
});

test("TS-SEC-02 HTML does not embed service_role", async ({ request }) => {
  const home = await (await request.get("/")).text();
  const brand = await (await request.get(`/library/${STABLE_BRAND_ID}`)).text();
  expect(home).not.toContain("service_role");
  expect(brand).not.toContain("service_role");
});

test("TS-ANALYTICS-01 home survives analytics 500", async ({ page }) => {
  await page.route("**/api/analytics/event", async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ ok: false }) });
  });
  await page.goto("/");
  await expect(page.locator("#matrix")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
});
