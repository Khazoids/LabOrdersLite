import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">Lab Orders Lite</Link>
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{patient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
            </dl>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-3">Orders</h2>
          <OrderTable orders={patient.orders} newOrderHref="/orders/new" />
        </div>
      </main>
    </div>
  )
}
