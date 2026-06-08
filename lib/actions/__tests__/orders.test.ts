import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { revalidatePath } from "next/cache"
import { createTestDb } from "@/tests/setup/db"
import { createPatient, createLabTest, createOrder as createOrderFactory } from "@/tests/setup/factories"
import type { PrismaClient } from "@/generated/prisma/client"
import { OrderStatus } from "@/generated/prisma/enums"

let db: { prisma: PrismaClient; cleanup: () => Promise<void> }
let createOrder: (patientId: string, name: string, labTestIds: string[]) => Promise<unknown>
let updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<unknown>
let deleteOrder: (orderId: string) => Promise<unknown>
let getOrders: () => Promise<unknown>

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db?.prisma
  },
}))

beforeAll(async () => {
  db = createTestDb()
  const mod = await import("@/lib/actions/orders")
  createOrder = mod.createOrder
  updateOrderStatus = mod.updateOrderStatus
  deleteOrder = mod.deleteOrder
  getOrders = mod.getOrders
})

afterAll(async () => {
  await db?.cleanup()
})

describe("createOrder", () => {
  it("creates an order and returns { success: true }", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)

    const result = await createOrder(patient.id, "Test Order", [labTest.id])
    expect(result).toEqual({ success: true })
  })

  it("creates an order with multiple lab tests", async () => {
    const patient = await createPatient(db.prisma)
    const t1 = await createLabTest(db.prisma, { code: "T1" })
    const t2 = await createLabTest(db.prisma, { code: "T2" })

    await createOrder(patient.id, "Multi-Test", [t1.id, t2.id])

    const orders = (await db.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }))
    const order = orders.find((o) => o.name === "Multi-Test")
    expect(order?.items).toHaveLength(2)
  })

  it("snapshots priceAtOrder independently of future lab test price changes", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma, { price: 50.0 })

    await createOrder(patient.id, "Price Snapshot", [labTest.id])
    await db.prisma.labTest.update({ where: { id: labTest.id }, data: { price: 999.0 } })

    const orders = (await getOrders()) as Array<{
      name: string
      items: Array<{ priceAtOrder: number }>
    }>
    const order = orders.find((o) => o.name === "Price Snapshot")
    expect(order?.items[0].priceAtOrder).toBeCloseTo(50.0)
  })

  it("calls revalidatePath('/') on success", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    vi.mocked(revalidatePath).mockClear()

    await createOrder(patient.id, "Revalidate Test", [labTest.id])

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("returns { success: false } for a non-existent patientId", async () => {
    const labTest = await createLabTest(db.prisma)
    const result = (await createOrder("bad-patient-id", "Bad Order", [labTest.id])) as {
      success: boolean
      error?: string
    }
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("does not call revalidatePath on failure", async () => {
    const labTest = await createLabTest(db.prisma)
    vi.mocked(revalidatePath).mockClear()

    await createOrder("bad-patient-id", "Will Fail", [labTest.id])

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("updateOrderStatus", () => {
  it("updates order status and returns { success: true }", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    const order = await createOrderFactory(db.prisma, patient.id, [labTest.id])

    const result = await updateOrderStatus(order.id, OrderStatus.IN_PROGRESS)
    expect(result).toEqual({ success: true })

    const updated = await db.prisma.order.findUnique({ where: { id: order.id } })
    expect(updated?.status).toBe(OrderStatus.IN_PROGRESS)
  })

  it("calls revalidatePath on success", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    const order = await createOrderFactory(db.prisma, patient.id, [labTest.id])
    vi.mocked(revalidatePath).mockClear()

    await updateOrderStatus(order.id, OrderStatus.COMPLETE)

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("returns { success: false } for a non-existent orderId", async () => {
    const result = (await updateOrderStatus("bad-id", OrderStatus.COMPLETE)) as {
      success: boolean
      error?: string
    }
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe("deleteOrder", () => {
  it("deletes the order and returns { success: true }", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    const order = await createOrderFactory(db.prisma, patient.id, [labTest.id])

    const result = await deleteOrder(order.id)
    expect(result).toEqual({ success: true })

    const found = await db.prisma.order.findUnique({ where: { id: order.id } })
    expect(found).toBeNull()
  })

  it("cascades deletion to OrderItems", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    const order = await createOrderFactory(db.prisma, patient.id, [labTest.id])
    const itemsBefore = await db.prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(itemsBefore).toHaveLength(1)

    await deleteOrder(order.id)

    const itemsAfter = await db.prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(itemsAfter).toHaveLength(0)
  })

  it("calls revalidatePath on success", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)
    const order = await createOrderFactory(db.prisma, patient.id, [labTest.id])
    vi.mocked(revalidatePath).mockClear()

    await deleteOrder(order.id)

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("returns { success: false } for a non-existent orderId", async () => {
    const result = (await deleteOrder("bad-id")) as { success: boolean; error?: string }
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe("getOrders", () => {
  beforeAll(async () => {
    // Clear orders left by createOrder/deleteOrder tests in the shared DB
    await db.prisma.orderItem.deleteMany()
    await db.prisma.order.deleteMany()
  })

  it("returns an empty array when no orders exist", async () => {
    const result = await getOrders()
    expect(result).toEqual([])
  })

  it("returns all orders with nested patient and items", async () => {
    const patient = await createPatient(db.prisma, { name: "Jane Doe" })
    const labTest = await createLabTest(db.prisma, { code: "NESTED" })
    await createOrderFactory(db.prisma, patient.id, [labTest.id], { name: "Nested Order" })

    const orders = (await getOrders()) as Array<{
      name: string
      patient: { name: string }
      items: Array<{ labTest: { code: string } }>
    }>
    const order = orders.find((o) => o.name === "Nested Order")
    expect(order?.patient.name).toBe("Jane Doe")
    expect(order?.items[0].labTest.code).toBe("NESTED")
  })

  it("returns orders sorted by createdAt descending", async () => {
    const patient = await createPatient(db.prisma)
    const labTest = await createLabTest(db.prisma)

    const older = await createOrderFactory(db.prisma, patient.id, [labTest.id], { name: "Older Order" })
    await new Promise((r) => setTimeout(r, 5))
    const newer = await createOrderFactory(db.prisma, patient.id, [labTest.id], { name: "Newer Order" })

    const orders = (await getOrders()) as Array<{ id: string }>
    const ids = orders.map((o) => o.id)
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id))
  })
})
