import { getPatients } from "@/lib/actions/patients"
import { getDashboardStats } from "@/lib/actions/orders"
import { AppHeader } from "@/components/ui/app-header"
import { PatientTable } from "@/components/patients/patient-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const [patients, stats] = await Promise.all([
    getPatients(),
    getDashboardStats(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold mt-1">{patients.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Open Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.openOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Completed This Month</p>
              <p className="text-2xl font-bold mt-1">{stats.completedThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientTable patients={patients} newPatientHref="/patients/new" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
