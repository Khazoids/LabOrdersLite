import type { PrismaClient } from "@/generated/prisma/client"
import { randomUUID } from "crypto"

export async function createPatient(
  prisma: PrismaClient,
  overrides: Partial<{
    name: string
    dateOfBirth: Date
    email: string | null
    phone: string | null
  }> = {}
) {
  return prisma.patient.create({
    data: {
      name: "Test Patient",
      dateOfBirth: new Date("1990-01-01"),
      email: null,
      phone: null,
      ...overrides,
    },
  })
}

export async function createLabTest(
  prisma: PrismaClient,
  overrides: Partial<{
    code: string
    name: string
    price: number
    turnaroundDays: number
  }> = {}
) {
  const code = overrides.code ?? `TST-${randomUUID().slice(0, 4).toUpperCase()}`
  return prisma.labTest.create({
    data: {
      code,
      name: "Generic Test",
      price: 50.0,
      turnaroundDays: 3,
      ...overrides,
    },
  })
}

export async function createOrder(
  prisma: PrismaClient,
  patientId: string,
  labTestIds: string[],
  overrides: Partial<{ name: string }> = {}
) {
  const labTests = await prisma.labTest.findMany({
    where: { id: { in: labTestIds } },
  })
  return prisma.order.create({
    data: {
      patientId,
      name: overrides.name ?? "Test Order",
      items: {
        create: labTests.map((t) => ({
          labTestId: t.id,
          priceAtOrder: t.price,
        })),
      },
    },
  })
}
