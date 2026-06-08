import { getPatients, getLabTests } from "@/lib/actions"
import { NewOrderForm } from "./new-order-form"

export default async function NewOrderPage() {
  const [patients, labTests] = await Promise.all([getPatients(), getLabTests()])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold">Lab Orders Lite</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <NewOrderForm patients={patients} labTests={labTests} />
      </main>
    </div>
  )
}
