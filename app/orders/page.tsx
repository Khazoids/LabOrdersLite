import { getOrders } from "@/lib/actions/orders"
import { AppHeader } from "@/components/ui/app-header"
import { OrderTable } from "@/components/orders/order-table"

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <OrderTable orders={orders} newOrderHref="/orders/new" showPatient />
      </main>
    </div>
  )
}
