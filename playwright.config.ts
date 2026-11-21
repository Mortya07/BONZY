import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 45000,
  use: { baseURL: "http://localhost:8081", trace: "retain-on-failure" },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1050 } } },
  ],
  webServer: {
    command: "node node_modules/expo/bin/cli start --web --port 8081",
    url: "http://localhost:8081",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
