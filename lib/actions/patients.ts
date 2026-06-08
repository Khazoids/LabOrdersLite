"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function getPatients() {
  return prisma.patient.findMany({ orderBy: { name: "asc" } })
}

export async function createPatient(formData: FormData) {
  const name = (formData.get("name") as string).trim()
  const dateOfBirth = formData.get("dateOfBirth") as string
  const email = (formData.get("email") as string).trim()
  const phone = (formData.get("phone") as string).trim()
  const address = (formData.get("address") as string).trim()

  await prisma.patient.create({
    data: { name, dateOfBirth: new Date(dateOfBirth), email, phone, address },
  })
  redirect("/")
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
