import { AppHeader } from "@/components/ui/app-header"
import { BackButton } from "@/components/ui/back-button"
import { getPatients } from "@/lib/actions/patients"
import { getLabTests } from "@/lib/actions/lab-tests"
import { NewOrderForm } from "@/components/orders/new-order-form"

export default async function NewOrderPage() {
  const [patients, labTests] = await Promise.all([getPatients(), getLabTests()])

  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={<BackButton />} />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <NewOrderForm patients={patients} labTests={labTests} />
      </main>
    </div>
  )
}
