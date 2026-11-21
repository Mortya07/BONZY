import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.BONZY_TEST_PORT ?? 8081);
const baseURL = "http://localhost:" + port;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 45000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1050 } } },
  ],
  webServer: {
    command: "node node_modules/expo/bin/cli start --web --port " + port,
    env: { BONZY_STAFF_DB: ":memory:" },
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
