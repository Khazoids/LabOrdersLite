import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/ui/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPatientWithOrders } from "@/lib/actions/patients"
import { OrderTable } from "@/components/orders/order-table"

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const patient = await getPatientWithOrders(id)
  if (!patient) notFound()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={
        <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      } />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Patients</Link>
          <span>/</span>
          <span className="text-foreground">{patient.name}</span>
        </nav>

        <Card>
          <CardHeader>
            <CardTitle>{patient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                <dd className="mt-1 font-medium">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium">{patient.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="mt-1 font-medium">{patient.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Address</dt>
                <dd className="mt-1 font-medium">{patient.address ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTable orders={patient.orders} newOrderHref="/orders/new" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
