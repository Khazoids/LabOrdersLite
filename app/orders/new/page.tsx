import Link from "next/link"
import { getPatients } from "@/lib/actions/patients"
import { getLabTests } from "@/lib/actions/lab-tests"
import { NewOrderForm } from "@/components/orders/new-order-form"

export default async function NewOrderPage() {
  const [patients, labTests] = await Promise.all([getPatients(), getLabTests()])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-semibold">Lab Orders Lite</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <NewOrderForm patients={patients} labTests={labTests} />
      </main>
    </div>
  )
}
