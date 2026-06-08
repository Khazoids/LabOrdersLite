import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createTestDb } from "@/tests/setup/db"
import { createLabTest } from "@/tests/setup/factories"
import type { PrismaClient } from "@/generated/prisma/client"

let db: { prisma: PrismaClient; cleanup: () => Promise<void> }
let getLabTests: () => Promise<unknown>

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db?.prisma
  },
}))

beforeAll(async () => {
  db = createTestDb()
  const mod = await import("@/lib/actions/lab-tests")
  getLabTests = mod.getLabTests
})

afterAll(async () => {
  await db?.cleanup()
})

describe("getLabTests", () => {
  it("returns an empty array when no lab tests exist", async () => {
    expect(await getLabTests()).toEqual([])
  })

  it("returns all lab tests sorted by name ascending", async () => {
    await createLabTest(db.prisma, { code: "Z1", name: "Zinc Panel" })
    await createLabTest(db.prisma, { code: "A1", name: "Albumin Test" })
    await createLabTest(db.prisma, { code: "M1", name: "Magnesium Test" })

    const tests = (await getLabTests()) as Array<{ name: string }>
    expect(tests.map((t) => t.name)).toEqual([
      "Albumin Test",
      "Magnesium Test",
      "Zinc Panel",
    ])
  })

  it("coerces Decimal price to a JS number", async () => {
    await createLabTest(db.prisma, { code: "DEC", price: 49.99 })

    const tests = (await getLabTests()) as Array<{ code: string; price: unknown }>
    const test = tests.find((t) => t.code === "DEC")
    expect(typeof test?.price).toBe("number")
    expect(test?.price as number).toBeCloseTo(49.99)
  })
})
