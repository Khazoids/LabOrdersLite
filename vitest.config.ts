/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    exclude: ["node_modules/**", "e2e/**"],
    environmentMatchGlobs: [
      ["lib/actions/__tests__/**", "node"],
      ["lib/__tests__/**", "node"],
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
})
