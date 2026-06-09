import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const TEST_DB_URL = "file:./test-e2e.db"

export default async function globalSetup() {
  const cwd = process.cwd()
  const dbFile = path.resolve(cwd, "test-e2e.db")

  // Write debug info so we can verify after the run
  fs.writeFileSync(path.resolve(cwd, "e2e-setup-debug.txt"), `cwd=${cwd}\ndbFile=${dbFile}\nurl=${TEST_DB_URL}\n`)

  if (fs.existsSync(dbFile)) {
    try {
      fs.unlinkSync(dbFile)
    } catch {
      // locked
    }
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
    cwd,
  })

  fs.appendFileSync(path.resolve(cwd, "e2e-setup-debug.txt"), `afterMigrate=${fs.existsSync(dbFile)}\nfileSize=${fs.existsSync(dbFile) ? fs.statSync(dbFile).size : -1}\n`)
}
