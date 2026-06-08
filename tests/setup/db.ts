import path from "path"
import os from "os"
import fs from "fs"
import { randomUUID } from "crypto"
import Database from "better-sqlite3"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

export function createTestDb() {
  const dbPath = path.join(os.tmpdir(), `lab-test-${randomUUID()}.db`)

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations")
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort()

  const rawDb = new Database(dbPath)
  rawDb.pragma("foreign_keys = ON")
  for (const folder of folders) {
    const sql = fs.readFileSync(
      path.join(migrationsDir, folder, "migration.sql"),
      "utf-8"
    )
    rawDb.exec(sql)
  }
  rawDb.close()

  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const prisma = new PrismaClient({ adapter })

  return {
    prisma,
    cleanup: async () => {
      await prisma.$disconnect()
      fs.rmSync(dbPath, { force: true })
    },
  }
}
