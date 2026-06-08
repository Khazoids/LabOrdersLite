import path from "path"
import fs from "fs"
import Database from "better-sqlite3"

export default async function globalSetup() {
  const dbPath = path.resolve(process.cwd(), "test-e2e.db")
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations")

  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort()

  // Try to delete the old DB for a clean slate; skip if file is locked (Windows)
  let canRecreate = true
  if (fs.existsSync(dbPath)) {
    try {
      fs.rmSync(dbPath)
    } catch {
      canRecreate = false
    }
  }

  if (canRecreate) {
    const rawDb = new Database(dbPath)
    rawDb.pragma("foreign_keys = ON")
    for (const folder of folders) {
      const sql = fs.readFileSync(path.join(migrationsDir, folder, "migration.sql"), "utf-8")
      rawDb.exec(sql)
    }
    rawDb.close()
  }
  // If canRecreate is false, the existing file has the schema already (same migrations)
}
