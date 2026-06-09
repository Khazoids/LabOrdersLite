/**
 * E2E test server startup script.
 * Runs prisma migrate deploy before starting the Next.js dev server so the
 * test DB schema is in place before any request is served.
 */
const { execSync, spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

const dbPath = path.resolve(__dirname, "..", "test-e2e.db")

// Remove stale DB for a clean schema; ignore if file is locked (Windows)
if (fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath) } catch {}
}

// Migrate — DATABASE_URL already set by Playwright's webServer.env
execSync("npx prisma migrate deploy", { stdio: "inherit" })

// Start the Next.js dev server
const next = spawn(
  "npx",
  ["next", "dev", "--port", "3001"],
  { stdio: "inherit", shell: true, env: process.env }
)

next.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGTERM", () => next.kill("SIGTERM"))
process.on("SIGINT", () => next.kill("SIGINT"))
