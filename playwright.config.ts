import { defineConfig, devices } from "@playwright/test"
import path from "path"

const testDbPath = path.resolve(process.cwd(), "test-e2e.db")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    env: {
      ENABLE_TEST_RESET: "1",
      DATABASE_URL: testDbPath,
    },
  },
})
