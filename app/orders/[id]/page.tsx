import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { AppHeader } from "@/components/ui/app-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditOrderDialog } from "@/components/orders/edit-order-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getOrderById } from "@/lib/actions/orders"
import { OrderStatusSelect } from "@/components/orders/order-status-select"

function deterministicResult(orderId: string, itemId: string): "Positive" | "Negative" {
  const str = orderId + itemId
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  return hash % 2 === 0 ? "Positive" : "Negative"
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  const isComplete = order.status === "COMPLETE"
  const total = order.items.reduce((s, i) => s + i.priceAtOrder, 0)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={
        <Button variant="ghost" nativeButton={false} render={<Link href={`/patients/${order.patientId}`} />}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      } />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Patients</Link>
          <span>/</span>
          <Link href={`/patients/${order.patientId}`} className="hover:text-foreground transition-colors">
            {order.patient.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{order.name ?? "Unnamed Order"}</span>
        </nav>

        <Card>
          <CardHeader>
            <CardTitle>{order.name ?? "Unnamed Order"}</CardTitle>
            <CardAction>
              <EditOrderDialog orderId={order.id} orderName={order.name} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Patient</dt>
                <dd className="mt-1 font-medium">
                  <Link href={`/patients/${order.patientId}`} className="underline underline-offset-2 hover:text-foreground/80">
                    {order.patient.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Date Ordered</dt>
                <dd className="mt-1 font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total</dt>
                <dd className="mt-1 font-medium">${total.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isComplete ? "Test Results" : "Ordered Tests"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Turnaround</TableHead>
                    <TableHead>Price</TableHead>
                    {isComplete && <TableHead>Result</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const result = isComplete ? deterministicResult(order.id, item.id) : null
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.labTest.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{item.labTest.code}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.labTest.turnaroundDays} {item.labTest.turnaroundDays === 1 ? "day" : "days"}
                        </TableCell>
                        <TableCell>${item.priceAtOrder.toFixed(2)}</TableCell>
                        {isComplete && (
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 font-medium text-sm ${result === "Positive" ? "text-destructive" : "text-green-600"}`}>
                              {result === "Positive"
                                ? <XCircle className="h-4 w-4" />
                                : <CheckCircle2 className="h-4 w-4" />}
                              {result}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
