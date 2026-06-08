"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { EMAIL_RE } from "@/lib/utils"
import type { ActionResult } from "@/lib/actions/orders"

export async function getPatients() {
  return prisma.patient.findMany({ orderBy: { name: "asc" } })
}

export async function createPatient(formData: FormData): Promise<ActionResult> {
  const firstName = (formData.get("firstName") as string).trim()
  const lastName = (formData.get("lastName") as string).trim()
  const dateOfBirth = formData.get("dateOfBirth") as string
  const email = (formData.get("email") as string).trim()
  const phone = (formData.get("phone") as string).trim()
  const streetAddress = (formData.get("streetAddress") as string).trim()
  const city = (formData.get("city") as string).trim()
  const state = (formData.get("state") as string).trim()
  const zipCode = (formData.get("zipCode") as string).trim()

  if (!firstName) return { success: false, error: "First name is required." }
  if (!lastName) return { success: false, error: "Last name is required." }
  if (!dateOfBirth) return { success: false, error: "Date of birth is required." }
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return { success: false, error: "Date of birth is invalid." }
  if (dob > new Date()) return { success: false, error: "Date of birth cannot be in the future." }
  if (!EMAIL_RE.test(email)) return { success: false, error: "Email address is invalid." }
  if (!phone) return { success: false, error: "Phone is required." }
  if (!streetAddress) return { success: false, error: "Street address is required." }
  if (!city) return { success: false, error: "City is required." }
  if (!state) return { success: false, error: "State is required." }
  if (!zipCode) return { success: false, error: "ZIP code is required." }

  const name = `${firstName} ${lastName}`
  const address = `${streetAddress}, ${city}, ${state} ${zipCode}`

  try {
    await prisma.patient.create({
      data: { name, dateOfBirth: dob, email, phone, address },
    })
    revalidatePath("/", "layout")
    return { success: true }
  } catch (err) {
    console.error("createPatient failed:", err)
    return { success: false, error: "Failed to create patient. Please try again." }
  }
}

export async function updatePatient(id: string, formData: FormData): Promise<ActionResult> {
  const firstName = (formData.get("firstName") as string).trim()
  const lastName = (formData.get("lastName") as string).trim()
  const dateOfBirth = formData.get("dateOfBirth") as string
  const email = (formData.get("email") as string).trim()
  const phone = (formData.get("phone") as string).trim()
  const streetAddress = (formData.get("streetAddress") as string).trim()
  const city = (formData.get("city") as string).trim()
  const state = (formData.get("state") as string).trim()
  const zipCode = (formData.get("zipCode") as string).trim()

  if (!firstName) return { success: false, error: "First name is required." }
  if (!lastName) return { success: false, error: "Last name is required." }
  if (!dateOfBirth) return { success: false, error: "Date of birth is required." }
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return { success: false, error: "Date of birth is invalid." }
  if (dob > new Date()) return { success: false, error: "Date of birth cannot be in the future." }
  if (!EMAIL_RE.test(email)) return { success: false, error: "Email address is invalid." }
  if (!phone) return { success: false, error: "Phone is required." }
  if (!streetAddress) return { success: false, error: "Street address is required." }
  if (!city) return { success: false, error: "City is required." }
  if (!state) return { success: false, error: "State is required." }
  if (!zipCode) return { success: false, error: "ZIP code is required." }

  const name = `${firstName} ${lastName}`
  const address = `${streetAddress}, ${city}, ${state} ${zipCode}`

  try {
    await prisma.patient.update({
      where: { id },
      data: { name, dateOfBirth: dob, email, phone, address },
    })
    revalidatePath("/", "layout")
    return { success: true }
  } catch (err) {
    console.error("updatePatient failed:", err)
    return { success: false, error: "Failed to update patient. Please try again." }
  }
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
