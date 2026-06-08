import path from "path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { OrderStatus } from "../generated/prisma/enums";

const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.patient.deleteMany();

  // Create patients
  const patient1 = await prisma.patient.create({
    data: {
      name: "John Smith",
      dateOfBirth: new Date("1975-03-15"),
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: "Sarah Johnson",
      dateOfBirth: new Date("1988-07-22"),
      email: "sarah.j@email.com",
      phone: "(555) 234-5678",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: "Michael Chen",
      dateOfBirth: new Date("1992-11-08"),
      email: "m.chen@email.com",
      phone: "(555) 345-6789",
    },
  });

  // Create lab tests
  const labTests = await Promise.all([
    prisma.labTest.create({
      data: {
        code: "CBC",
        name: "Complete Blood Count",
        price: 45.0,
        turnaroundDays: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        code: "CMP",
        name: "Comprehensive Metabolic Panel",
        price: 65.0,
        turnaroundDays: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        code: "TSH",
        name: "Thyroid Stimulating Hormone",
        price: 35.0,
        turnaroundDays: 2,
      },
    }),
    prisma.labTest.create({
      data: {
        code: "LIP",
        name: "Lipid Panel",
        price: 55.0,
        turnaroundDays: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        code: "UA",
        name: "Urinalysis",
        price: 25.0,
        turnaroundDays: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        code: "COVID",
        name: "COVID-19 PCR Test",
        price: 75.0,
        turnaroundDays: 1,
      },
    }),
  ]);

  // Create orders for patient1
  const order1 = await prisma.order.create({
    data: {
      patientId: patient1.id,
      status: OrderStatus.COMPLETE,
      items: {
        create: [
          {
            labTestId: labTests[0].id, // CBC
            priceAtOrder: labTests[0].price,
          },
          {
            labTestId: labTests[1].id, // CMP
            priceAtOrder: labTests[1].price,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      patientId: patient1.id,
      status: OrderStatus.PENDING,
      items: {
        create: [
          {
            labTestId: labTests[2].id, // TSH
            priceAtOrder: labTests[2].price,
          },
          {
            labTestId: labTests[3].id, // LIP
            priceAtOrder: labTests[3].price,
          },
          {
            labTestId: labTests[4].id, // UA
            priceAtOrder: labTests[4].price,
          },
        ],
      },
    },
  });

  console.log("✓ Database seeded successfully");
  console.log(`  - Created ${3} patients`);
  console.log(`  - Created ${labTests.length} lab tests`);
  console.log(`  - Created ${2} orders`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
