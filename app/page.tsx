import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderStatusSelect } from "@/components/order-status-select"
import { DeleteOrderButton } from "@/components/delete-order-button"
import { getOrders } from "@/lib/actions"
import { OrderStatus } from "@/generated/prisma/enums"

const STATUS_BADGE: Record<OrderStatus, "default" | "secondary" | "outline"> =
  {
    PENDING: "outline",
    IN_PROGRESS: "secondary",
    COMPLETE: "default",
  }

export default async function HomePage() {
  const orders = await getOrders()

  const totalRevenue = orders.reduce(
    (sum, o) =>
      sum + o.items.reduce((s, i) => s + Number(i.priceAtOrder), 0),
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Lab Orders Lite</h1>
          <Button render={<Link href="/orders/new" />}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Orders" value={orders.length} />
          <StatCard
            label="Pending"
            value={orders.filter((o) => o.status === "PENDING").length}
          />
          <StatCard
            label="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12"
                  >
                    No orders yet.{" "}
                    <Link href="/orders/new" className="underline">
                      Create one
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => {
                const total = order.items.reduce(
                  (s, i) => s + Number(i.priceAtOrder),
                  0
                )
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.patient.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {item.labTest.code}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>${total.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <OrderStatusSelect
                        orderId={order.id}
                        status={order.status}
                      />
                    </TableCell>
                    <TableCell>
                      <DeleteOrderButton orderId={order.id} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}
