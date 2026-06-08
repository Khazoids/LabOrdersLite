"use server"

import { prisma } from "@/lib/prisma"

export async function getPatients() {
  return prisma.patient.findMany({ orderBy: { name: "asc" } })
}

export async function getPatientWithOrders(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: { include: { labTest: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!patient) return null
  return {
    ...patient,
    orders: patient.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        priceAtOrder: Number(item.priceAtOrder),
        labTest: { ...item.labTest, price: Number(item.labTest.price) },
      })),
    })),
  }
}
