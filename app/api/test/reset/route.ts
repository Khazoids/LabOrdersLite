import { NextResponse } from "next/server"
import path from "path"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { OrderStatus } from "@/generated/prisma/enums"

export async function GET() {
  if (process.env.ENABLE_TEST_RESET !== "1") {
    return NextResponse.json({ error: "Not available" }, { status: 403 })
  }

  const dbUrl = process.env.DATABASE_URL ?? path.resolve(process.cwd(), "dev.db")
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  const prisma = new PrismaClient({ adapter })

  try {
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.labTest.deleteMany()
    await prisma.patient.deleteMany()

    const [p1, p2] = await Promise.all([
      prisma.patient.create({
        data: { name: "John Smith", dateOfBirth: new Date("1975-03-15"), email: "john@example.com", phone: "(555) 123-4567" },
      }),
      prisma.patient.create({
        data: { name: "Sarah Johnson", dateOfBirth: new Date("1988-07-22"), email: "sarah@example.com", phone: "(555) 234-5678" },
      }),
    ])

    const [cbc, cmp, tsh] = await Promise.all([
      prisma.labTest.create({ data: { code: "CBC", name: "Complete Blood Count", price: 45.0, turnaroundDays: 1 } }),
      prisma.labTest.create({ data: { code: "CMP", name: "Comprehensive Metabolic Panel", price: 65.0, turnaroundDays: 1 } }),
      prisma.labTest.create({ data: { code: "TSH", name: "Thyroid Stimulating Hormone", price: 35.0, turnaroundDays: 2 } }),
    ])

    await prisma.order.create({
      data: {
        patientId: p1.id,
        name: "Annual Checkup",
        status: OrderStatus.COMPLETE,
        items: { create: [{ labTestId: cbc.id, priceAtOrder: cbc.price }, { labTestId: cmp.id, priceAtOrder: cmp.price }] },
      },
    })

    return NextResponse.json({ ok: true })
  } finally {
    await prisma.$disconnect()
  }
}
