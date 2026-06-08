"use server"

import { prisma } from "@/lib/prisma"

export async function getLabTests() {
  const tests = await prisma.labTest.findMany({ orderBy: { name: "asc" } })
  return tests.map((t) => ({ ...t, price: Number(t.price) }))
}
