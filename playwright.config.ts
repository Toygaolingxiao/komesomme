import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 3000);
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/e2e-results.json" }],
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-chromium",
      // Pixel 5 device descriptor is Chromium (iPhone* defaults to WebKit).
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
      testMatch: /mobile|brand|legal|seo|security/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx cross-env NODE_OPTIONS=--use-system-ca next start -p ${port} -H 127.0.0.1`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_SITE_URL: baseURL,
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          SUPABASE_SERVICE_ROLE_KEY: "ci-service-placeholder",
          EMBEDDING_PROVIDER: "gemini",
          GEMINI_API_KEY: "ci-gemini-placeholder",
          SEMANTIC_RECOMMEND_ENABLED: "false",
          ACCESS_LOG_ENABLED: "false",
        },
      },
});
