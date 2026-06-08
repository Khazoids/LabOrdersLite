import { getOrders } from "@/lib/actions/orders"
import { getOrderStatus } from "@/lib/order-status"
import { AppHeader } from "@/components/ui/app-header"
import { OrderTable } from "@/components/orders/order-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function OrdersPage() {
  const orders = await getOrders()

  const statusCounts = orders.reduce(
    (acc, order) => {
      const max = Math.max(0, ...order.items.map((i) => i.labTest.turnaroundDays))
      const status = getOrderStatus(order.createdAt, max)
      acc[status]++
      return acc
    },
    { PENDING: 0, IN_PROGRESS: 0, COMPLETE: 0 }
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.PENDING}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.IN_PROGRESS}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Complete</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.COMPLETE}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTable orders={orders} newOrderHref="/orders/new" showPatient />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
