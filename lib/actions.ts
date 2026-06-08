"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "./prisma"
import { OrderStatus } from "@/generated/prisma/enums"

export type ActionResult = { success: true } | { success: false; error: string }

export async function getOrders() {
  return prisma.order.findMany({
    include: {
      patient: true,
      items: { include: { labTest: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPatients() {
  return prisma.patient.findMany({ orderBy: { name: "asc" } })
}

export async function getLabTests() {
  return prisma.labTest.findMany({ orderBy: { name: "asc" } })
}

export async function createOrder(patientId: string, labTestIds: string[]): Promise<ActionResult> {
  try {
    const labTests = await prisma.labTest.findMany({
      where: { id: { in: labTestIds } },
    })
    await prisma.order.create({
      data: {
        patientId,
        items: {
          create: labTests.map((t) => ({
            labTestId: t.id,
            priceAtOrder: t.price,
          })),
        },
      },
    })
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    console.error("createOrder failed:", err)
    return { success: false, error: "Failed to create order. Please try again." }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    console.error("updateOrderStatus failed:", err)
    return { success: false, error: "Failed to update status. Please try again." }
  }
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  try {
    await prisma.order.delete({ where: { id: orderId } })
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    console.error("deleteOrder failed:", err)
    return { success: false, error: "Failed to delete order. Please try again." }
  }
}
