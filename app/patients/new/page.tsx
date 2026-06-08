import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/ui/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewPatientForm } from "@/components/patients/new-patient-form"

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={
        <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      } />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>New Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <NewPatientForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
