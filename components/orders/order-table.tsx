"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpDown, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"
import type { OrderStatus } from "@/lib/order-status"

type Order = {
  id: string
  name: string | null
  status: OrderStatus
  createdAt: Date | string
  patientId?: string
  patient?: { id: string; name: string }
  items: {
    id: string
    priceAtOrder: number
    labTest: { id: string; code: string; name: string; turnaroundDays: number }
  }[]
}

type SortKey = "name" | "total" | "date"
type Selection = SortKey | `status:${OrderStatus}`

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  total: "Total",
  date: "Date",
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
}

const STATUS_VARIANTS: Record<OrderStatus, "outline" | "secondary" | "default"> = {
  PENDING: "outline",
  IN_PROGRESS: "secondary",
  COMPLETE: "default",
}

function selectionLabel(sel: Selection): string {
  if (sel.startsWith("status:")) {
    const status = sel.slice(7) as OrderStatus
    return `Status: ${STATUS_LABELS[status]}`
  }
  return `Sort: ${SORT_LABELS[sel as SortKey]}`
}

export function OrderTable({
  orders,
  newOrderHref,
  showPatient = false,
}: {
  orders: Order[]
  newOrderHref: string
  showPatient?: boolean
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selection, setSelection] = useState<Selection>("date")

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((order) => {
        if (q) {
          const matchesName = (order.name ?? "").toLowerCase().includes(q)
          const matchesId = order.id.toLowerCase().includes(q)
          const matchesPatient = showPatient && (order.patient?.name ?? "").toLowerCase().includes(q)
          if (!matchesName && !matchesId && !matchesPatient) return false
        }
        if (selection.startsWith("status:")) {
          const filterStatus = selection.slice(7) as OrderStatus
          return order.status === filterStatus
        }
        return true
      })
      .sort((a, b) => {
        if (selection.startsWith("status:")) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        switch (selection) {
          case "name":
            return (a.name ?? "").localeCompare(b.name ?? "")
          case "total": {
            const aTotal = a.items.reduce((s, i) => s + i.priceAtOrder, 0)
            const bTotal = b.items.reduce((s, i) => s + i.priceAtOrder, 0)
            return aTotal - bTotal
          }
          case "date":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      })
  }, [orders, search, selection, showPatient])

  const colSpan = showPatient ? 7 : 6

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or order ID…"
            value={search}
            onValueChange={setSearch}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })}>
            <ArrowUpDown className="h-4 w-4" />
            {selectionLabel(selection)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={selection}
              onValueChange={(v) => setSelection(v as Selection)}
            >
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="total">Total</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status:PENDING">Status: Pending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status:IN_PROGRESS">Status: In Progress</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status:COMPLETE">Status: Complete</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button nativeButton={false} render={<Link href={newOrderHref} />}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {showPatient && <TableHead>Patient</TableHead>}
              <TableHead>Name</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground py-12"
                >
                  {search ? "No orders match your search." : "No orders yet."}
                </TableCell>
              </TableRow>
            )}
            {displayed.map((order) => {
              const total = order.items.reduce((s, i) => s + i.priceAtOrder, 0)
              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {showPatient && order.patient && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/patients/${order.patient.id}`}
                        className="font-medium hover:underline underline-offset-2"
                      >
                        {order.patient.name}
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{order.name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item) => (
                        <Badge key={item.id} variant="secondary" className="text-xs">
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
                    <Badge variant={STATUS_VARIANTS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DeleteOrderButton orderId={order.id} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
