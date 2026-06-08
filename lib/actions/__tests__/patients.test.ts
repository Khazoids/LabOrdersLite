import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createTestDb } from "@/tests/setup/db"
import { createPatient, createLabTest, createOrder } from "@/tests/setup/factories"
import type { PrismaClient } from "@/generated/prisma/client"

let db: { prisma: PrismaClient; cleanup: () => Promise<void> }
let getPatients: () => Promise<unknown>
let getPatientWithOrders: (id: string) => Promise<unknown>
let createPatientAction: (formData: FormData) => Promise<void>

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db?.prisma
  },
}))

vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

beforeAll(async () => {
  db = createTestDb()
  const mod = await import("@/lib/actions/patients")
  getPatients = mod.getPatients
  getPatientWithOrders = mod.getPatientWithOrders
  createPatientAction = mod.createPatient
})

afterAll(async () => {
  await db?.cleanup()
})

describe("getPatients", () => {
  it("returns an empty array when no patients exist", async () => {
    const result = await getPatients()
    expect(result).toEqual([])
  })

  it("returns all patients ordered by name ascending", async () => {
    await createPatient(db.prisma, { name: "Zoe Adams" })
    await createPatient(db.prisma, { name: "Alice Brown" })
    await createPatient(db.prisma, { name: "Mike Chen" })

    const patients = (await getPatients()) as Array<{ name: string }>
    expect(patients.map((p) => p.name)).toEqual(["Alice Brown", "Mike Chen", "Zoe Adams"])
  })
})

describe("getPatientWithOrders", () => {
  it("returns null for a non-existent id", async () => {
    expect(await getPatientWithOrders("non-existent-id")).toBeNull()
  })

  it("returns the patient with an empty orders array when they have no orders", async () => {
    const patient = await createPatient(db.prisma, { name: "No Orders Patient" })
    const result = (await getPatientWithOrders(patient.id)) as {
      id: string
      orders: unknown[]
    }
    expect(result?.id).toBe(patient.id)
    expect(result?.orders).toEqual([])
  })

  it("returns patient with nested orders, items, and lab tests", async () => {
    const patient = await createPatient(db.prisma, { name: "Order Patient" })
    const labTest = await createLabTest(db.prisma, { code: "CBC", price: 45.0 })
    await createOrder(db.prisma, patient.id, [labTest.id], { name: "Annual Checkup" })

    const result = (await getPatientWithOrders(patient.id)) as {
      id: string
      orders: Array<{
        name: string
        items: Array<{ priceAtOrder: number; labTest: { code: string; price: number } }>
      }>
    }

    expect(result?.id).toBe(patient.id)
    expect(result?.orders).toHaveLength(1)
    expect(result?.orders[0].name).toBe("Annual Checkup")
    expect(result?.orders[0].items).toHaveLength(1)
    expect(result?.orders[0].items[0].labTest.code).toBe("CBC")
  })

  it("coerces Decimal priceAtOrder to a JS number", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma, { price: 99.99 })
    await createOrder(db.prisma, patient.id, [labTest.id])

    const result = (await getPatientWithOrders(patient.id)) as {
      orders: Array<{ items: Array<{ priceAtOrder: unknown }> }>
    }
    expect(typeof result?.orders[0].items[0].priceAtOrder).toBe("number")
    expect(result?.orders[0].items[0].priceAtOrder).toBeCloseTo(99.99)
  })

  it("coerces Decimal labTest.price to a JS number", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma, { price: 37.5 })
    await createOrder(db.prisma, patient.id, [labTest.id])

    const result = (await getPatientWithOrders(patient.id)) as {
      orders: Array<{ items: Array<{ labTest: { price: unknown } }> }>
    }
    expect(typeof result?.orders[0].items[0].labTest.price).toBe("number")
    expect(result?.orders[0].items[0].labTest.price).toBeCloseTo(37.5)
  })

  it("returns orders sorted by createdAt descending", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)

    const older = await createOrder(db.prisma, patient.id, [labTest.id], { name: "Older" })
    await new Promise((r) => setTimeout(r, 5))
    const newer = await createOrder(db.prisma, patient.id, [labTest.id], { name: "Newer" })

    const result = (await getPatientWithOrders(patient.id)) as {
      orders: Array<{ id: string }>
    }
    expect(result?.orders[0].id).toBe(newer.id)
    expect(result?.orders[1].id).toBe(older.id)
  })
})

describe("createPatient", () => {
  function makeFormData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
  }

  it("creates a patient record with all fields and redirects to /", async () => {
    const { redirect } = await import("next/navigation")
    const formData = makeFormData({
      name: "Jane Doe",
      dateOfBirth: "1992-03-15",
      email: "jane@example.com",
      phone: "555-9876",
      address: "123 Main St",
    })

    await createPatientAction(formData)

    const patients = (await getPatients()) as Array<{ name: string; email: string | null }>
    const created = patients.find((p) => p.name === "Jane Doe")
    expect(created).toBeDefined()
    expect(created?.email).toBe("jane@example.com")
    expect(redirect).toHaveBeenCalledWith("/")
  })

  it("stores dateOfBirth as a Date object", async () => {
    const formData = makeFormData({
      name: "DOB Patient",
      dateOfBirth: "1985-07-20",
      email: "dob@example.com",
      phone: "555-0000",
      address: "456 Oak Ave",
    })

    await createPatientAction(formData)

    const patients = (await getPatients()) as Array<{ name: string; dateOfBirth: Date }>
    const created = patients.find((p) => p.name === "DOB Patient")
    expect(created?.dateOfBirth).toBeInstanceOf(Date)
  })

  it("trims whitespace from string fields before saving", async () => {
    const formData = makeFormData({
      name: "  Spaced Name  ",
      dateOfBirth: "2000-01-01",
      email: "  spaced@example.com  ",
      phone: "  555-0001  ",
      address: "  789 Elm St  ",
    })

    await createPatientAction(formData)

    const patients = (await getPatients()) as Array<{
      name: string
      email: string | null
      phone: string | null
      address: string | null
    }>
    const created = patients.find((p) => p.name === "Spaced Name")
    expect(created).toBeDefined()
    expect(created?.email).toBe("spaced@example.com")
    expect(created?.phone).toBe("555-0001")
    expect(created?.address).toBe("789 Elm St")
  })

  it("is immediately findable via getPatients after creation", async () => {
    const before = (await getPatients()) as Array<{ name: string }>
    const formData = makeFormData({
      name: "Findable Patient",
      dateOfBirth: "1995-08-10",
      email: "find@example.com",
      phone: "555-2222",
      address: "1 Discovery Rd",
    })

    await createPatientAction(formData)

    const after = (await getPatients()) as Array<{ name: string }>
    expect(after.length).toBe(before.length + 1)
    expect(after.some((p) => p.name === "Findable Patient")).toBe(true)
  })
})
