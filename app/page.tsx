import Link from "next/link"
import { getPatients } from "@/lib/actions/patients"
import { PatientTable } from "@/components/patients/patient-table"

export default async function HomePage() {
  const patients = await getPatients()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-semibold">Lab Orders Lite</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <PatientTable patients={patients} />
      </main>
    </div>
  )
}
