import path from "path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.patient.deleteMany();

  // Create patients
  const [patient1, patient2, patient3] = await Promise.all([
    prisma.patient.create({
      data: {
        name: "John Smith",
        dateOfBirth: new Date("1975-03-15"),
        email: "john.smith@email.com",
        phone: "(555) 123-4567",
        address: "142 Elm Street, Springfield, IL 62701",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Sarah Johnson",
        dateOfBirth: new Date("1988-07-22"),
        email: "sarah.j@email.com",
        phone: "(555) 234-5678",
        address: "87 Maple Avenue, Austin, TX 78701",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Michael Chen",
        dateOfBirth: new Date("1992-11-08"),
        email: "m.chen@email.com",
        phone: "(555) 345-6789",
        address: "305 Ocean Drive, San Diego, CA 92101",
      },
    }),
  ]);

  // Create lab tests
  const [cbc, cmp, tsh, lip, ua, covid] = await Promise.all([
    prisma.labTest.create({ data: { code: "CBC",   name: "Complete Blood Count",          price: 45.0, turnaroundDays: 1 } }),
    prisma.labTest.create({ data: { code: "CMP",   name: "Comprehensive Metabolic Panel", price: 65.0, turnaroundDays: 1 } }),
    prisma.labTest.create({ data: { code: "TSH",   name: "Thyroid Stimulating Hormone",   price: 35.0, turnaroundDays: 2 } }),
    prisma.labTest.create({ data: { code: "LIP",   name: "Lipid Panel",                   price: 55.0, turnaroundDays: 1 } }),
    prisma.labTest.create({ data: { code: "UA",    name: "Urinalysis",                    price: 25.0, turnaroundDays: 1 } }),
    prisma.labTest.create({ data: { code: "COVID", name: "COVID-19 PCR Test",             price: 75.0, turnaroundDays: 1 } }),
  ]);

  // ── John Smith ──────────────────────────────────────────────────────────────
  // COMPLETE: ordered 7 days ago, 1-day turnaround
  await prisma.order.create({
    data: {
      patientId: patient1.id,
      name: "Annual Checkup",
      createdAt: daysAgo(7),
      items: { create: [
        { labTestId: cbc.id, priceAtOrder: cbc.price },
        { labTestId: cmp.id, priceAtOrder: cmp.price },
      ]},
    },
  });

  // COMPLETE: ordered 3 days ago, max turnaround 2 days (TSH)
  await prisma.order.create({
    data: {
      patientId: patient1.id,
      name: "Thyroid Panel",
      createdAt: daysAgo(3),
      items: { create: [
        { labTestId: tsh.id, priceAtOrder: tsh.price },
        { labTestId: lip.id, priceAtOrder: lip.price },
      ]},
    },
  });

  // PENDING: ordered today
  await prisma.order.create({
    data: {
      patientId: patient1.id,
      name: "Follow-up Panel",
      createdAt: daysAgo(0),
      items: { create: [
        { labTestId: ua.id,  priceAtOrder: ua.price },
        { labTestId: cbc.id, priceAtOrder: cbc.price },
      ]},
    },
  });

  // ── Sarah Johnson ────────────────────────────────────────────────────────────
  // COMPLETE: ordered 5 days ago, 1-day turnaround
  await prisma.order.create({
    data: {
      patientId: patient2.id,
      name: "Wellness Screen",
      createdAt: daysAgo(5),
      items: { create: [
        { labTestId: cbc.id,   priceAtOrder: cbc.price },
        { labTestId: cmp.id,   priceAtOrder: cmp.price },
        { labTestId: covid.id, priceAtOrder: covid.price },
      ]},
    },
  });

  // IN_PROGRESS: ordered yesterday, 2-day turnaround (TSH not yet done)
  await prisma.order.create({
    data: {
      patientId: patient2.id,
      name: "Hormone Check",
      createdAt: daysAgo(1),
      items: { create: [
        { labTestId: tsh.id, priceAtOrder: tsh.price },
      ]},
    },
  });

  // ── Michael Chen ─────────────────────────────────────────────────────────────
  // COMPLETE: ordered 10 days ago
  await prisma.order.create({
    data: {
      patientId: patient3.id,
      name: "Pre-Employment Screen",
      createdAt: daysAgo(10),
      items: { create: [
        { labTestId: cbc.id,   priceAtOrder: cbc.price },
        { labTestId: ua.id,    priceAtOrder: ua.price },
        { labTestId: covid.id, priceAtOrder: covid.price },
      ]},
    },
  });

  // IN_PROGRESS: ordered yesterday, 1-day turnaround (just crossed)
  await prisma.order.create({
    data: {
      patientId: patient3.id,
      name: "Lipid Screening",
      createdAt: daysAgo(1),
      items: { create: [
        { labTestId: lip.id, priceAtOrder: lip.price },
        { labTestId: cmp.id, priceAtOrder: cmp.price },
      ]},
    },
  });

  console.log("✓ Database seeded successfully");
  console.log("  - 3 patients");
  console.log("  - 6 lab tests");
  console.log("  - 7 orders (3 complete, 2 in-progress, 2 pending)");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
