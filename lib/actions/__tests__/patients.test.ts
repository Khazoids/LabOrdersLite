import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createTestDb } from "@/tests/setup/db"
import { createPatient, createLabTest, createOrder } from "@/tests/setup/factories"
import type { PrismaClient } from "@/generated/prisma/client"

let db: { prisma: PrismaClient; cleanup: () => Promise<void> }
let getPatients: () => Promise<unknown>
let getPatientWithOrders: (id: string) => Promise<unknown>
let createPatientAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>
let updatePatientAction: (id: string, formData: FormData) => Promise<{ success: boolean; error?: string }>

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db?.prisma
  },
}))

beforeAll(async () => {
  db = createTestDb()
  const mod = await import("@/lib/actions/patients")
  getPatients = mod.getPatients
  getPatientWithOrders = mod.getPatientWithOrders
  createPatientAction = mod.createPatient as typeof createPatientAction
  updatePatientAction = mod.updatePatient as typeof updatePatientAction
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

  const VALID = {
    firstName: "Jane",
    lastName: "Doe",
    dateOfBirth: "1992-03-15",
    email: "jane@example.com",
    phone: "555-9876",
    streetAddress: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
  }

  it("creates a patient record and returns { success: true }", async () => {
    const result = await createPatientAction(makeFormData(VALID))
    expect(result).toEqual({ success: true })

    const patients = (await getPatients()) as Array<{ name: string; email: string | null }>
    const created = patients.find((p) => p.name === "Jane Doe")
    expect(created).toBeDefined()
    expect(created?.email).toBe("jane@example.com")
  })

  it("assembles full name from firstName and lastName", async () => {
    await createPatientAction(makeFormData({ ...VALID, firstName: "Alice", lastName: "Smith" }))

    const patients = (await getPatients()) as Array<{ name: string }>
    expect(patients.some((p) => p.name === "Alice Smith")).toBe(true)
  })

  it("assembles address from street, city, state, and zip", async () => {
    await createPatientAction(makeFormData({ ...VALID, firstName: "Addr", lastName: "Patient" }))

    const patients = (await getPatients()) as Array<{ name: string; address: string | null }>
    const created = patients.find((p) => p.name === "Addr Patient")
    expect(created?.address).toBe("123 Main St, Springfield, IL 62701")
  })

  it("stores dateOfBirth as a Date object", async () => {
    await createPatientAction(makeFormData({ ...VALID, firstName: "DOB", lastName: "Patient" }))

    const patients = (await getPatients()) as Array<{ name: string; dateOfBirth: Date }>
    const created = patients.find((p) => p.name === "DOB Patient")
    expect(created?.dateOfBirth).toBeInstanceOf(Date)
  })

  it("trims whitespace from string fields before saving", async () => {
    await createPatientAction(makeFormData({
      firstName: "  Spaced  ",
      lastName: "  Name  ",
      dateOfBirth: "2000-01-01",
      email: "  spaced@example.com  ",
      phone: "  555-0001  ",
      streetAddress: "  789 Elm St  ",
      city: "  Chicago  ",
      state: "  IL  ",
      zipCode: "  60601  ",
    }))

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
    expect(created?.address).toBe("789 Elm St, Chicago, IL 60601")
  })

  it("is immediately findable via getPatients after creation", async () => {
    const before = (await getPatients()) as Array<{ name: string }>
    await createPatientAction(makeFormData({ ...VALID, firstName: "Findable", lastName: "Patient" }))
    const after = (await getPatients()) as Array<{ name: string }>
    expect(after.length).toBe(before.length + 1)
    expect(after.some((p) => p.name === "Findable Patient")).toBe(true)
  })

  it("returns { success: false } when firstName is empty", async () => {
    const result = await createPatientAction(makeFormData({ ...VALID, firstName: "" }))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/first name/i)
  })

  it("returns { success: false } when lastName is empty", async () => {
    const result = await createPatientAction(makeFormData({ ...VALID, lastName: "" }))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/last name/i)
  })

  it("returns { success: false } when dateOfBirth is in the future", async () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const result = await createPatientAction(
      makeFormData({ ...VALID, dateOfBirth: future.toISOString().slice(0, 10) })
    )
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/future/i)
  })

  it("returns { success: false } when email format is invalid", async () => {
    const result = await createPatientAction(makeFormData({ ...VALID, email: "not-an-email" }))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/email/i)
  })

  it("returns { success: false } when a required field is empty", async () => {
    const result = await createPatientAction(makeFormData({ ...VALID, phone: "" }))
    expect(result.success).toBe(false)
  })
})

describe("updatePatient", () => {
  function makeFormData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
  }

  const VALID = {
    firstName: "Jane",
    lastName: "Doe",
    dateOfBirth: "1992-03-15",
    email: "jane@example.com",
    phone: "555-9876",
    streetAddress: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
  }

  it("updates the patient and returns { success: true }", async () => {
    const patient = await createPatient(db.prisma, { name: "Old Name" })
    const result = await updatePatientAction(patient.id, makeFormData({ ...VALID, firstName: "Updated", lastName: "Name" }))
    expect(result).toEqual({ success: true })

    const updated = await db.prisma.patient.findUnique({ where: { id: patient.id } })
    expect(updated?.name).toBe("Updated Name")
  })

  it("persists all updated fields to the database", async () => {
    const patient = await createPatient(db.prisma)
    await updatePatientAction(patient.id, makeFormData(VALID))

    const updated = await db.prisma.patient.findUnique({ where: { id: patient.id } })
    expect(updated?.name).toBe("Jane Doe")
    expect(updated?.email).toBe("jane@example.com")
    expect(updated?.phone).toBe("555-9876")
    expect(updated?.address).toBe("123 Main St, Springfield, IL 62701")
  })

  it("assembles full name from firstName and lastName", async () => {
    const patient = await createPatient(db.prisma)
    await updatePatientAction(patient.id, makeFormData({ ...VALID, firstName: "Alice", lastName: "Smith" }))

    const updated = await db.prisma.patient.findUnique({ where: { id: patient.id } })
    expect(updated?.name).toBe("Alice Smith")
  })

  it("assembles address from street, city, state, and zip", async () => {
    const patient = await createPatient(db.prisma)
    await updatePatientAction(patient.id, makeFormData({
      ...VALID,
      streetAddress: "456 Oak Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
    }))

    const updated = await db.prisma.patient.findUnique({ where: { id: patient.id } })
    expect(updated?.address).toBe("456 Oak Ave, Chicago, IL 60601")
  })

  it("updates dateOfBirth as a Date object", async () => {
    const patient = await createPatient(db.prisma)
    await updatePatientAction(patient.id, makeFormData({ ...VALID, dateOfBirth: "2000-06-01" }))

    const updated = await db.prisma.patient.findUnique({ where: { id: patient.id } })
    expect(updated?.dateOfBirth).toBeInstanceOf(Date)
    expect(updated?.dateOfBirth.toISOString().slice(0, 10)).toBe("2000-06-01")
  })

  it("does not affect other patients", async () => {
    const p1 = await createPatient(db.prisma, { name: "Patient One" })
    const p2 = await createPatient(db.prisma, { name: "Patient Two" })

    await updatePatientAction(p1.id, makeFormData(VALID))

    const p2After = await db.prisma.patient.findUnique({ where: { id: p2.id } })
    expect(p2After?.name).toBe("Patient Two")
  })

  it("calls revalidatePath on success", async () => {
    const { revalidatePath } = await import("next/cache")
    vi.mocked(revalidatePath).mockClear()
    const patient = await createPatient(db.prisma)

    await updatePatientAction(patient.id, makeFormData(VALID))

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("returns { success: false } when firstName is empty", async () => {
    const patient = await createPatient(db.prisma)
    const result = await updatePatientAction(patient.id, makeFormData({ ...VALID, firstName: "" }))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/first name/i)
  })

  it("returns { success: false } when email format is invalid", async () => {
    const patient = await createPatient(db.prisma)
    const result = await updatePatientAction(patient.id, makeFormData({ ...VALID, email: "bad-email" }))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/email/i)
  })

  it("returns { success: false } when dateOfBirth is in the future", async () => {
    const patient = await createPatient(db.prisma)
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const result = await updatePatientAction(
      patient.id,
      makeFormData({ ...VALID, dateOfBirth: future.toISOString().slice(0, 10) })
    )
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/future/i)
  })

  it("returns { success: false } for a non-existent patient id", async () => {
    const result = await updatePatientAction("non-existent-id", makeFormData(VALID))
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
