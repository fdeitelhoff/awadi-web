import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.local so TEST_USER_EMAIL and TEST_USER_PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // shared database — run tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: "http://awadi.localhost:1355",
    locale: "de-DE",
    trace: "on-first-retry",
  },

  projects: [
    // Auth setup runs first — writes the session file
    {
      name: "setup",
      testMatch: /setup\/auth\.setup\.ts/,
    },
    // All other tests load the session file written by setup
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "pnpm dev",
    // Use the internal Next.js port for readiness check — Node.js can resolve
    // localhost but not awadi.localhost (portless handles the subdomain mapping).
    // Chromium resolves awadi.localhost natively, so baseURL works in tests.
    url: "http://localhost:4775",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
