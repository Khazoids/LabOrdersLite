"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
import { OrderStatusSelect } from "@/components/orders/order-status-select"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"
import { OrderStatus } from "@/generated/prisma/enums"

type Order = {
  id: string
  name: string | null
  status: OrderStatus
  createdAt: Date | string
  items: {
    id: string
    priceAtOrder: number
    labTest: { id: string; code: string; name: string }
  }[]
}

type SortKey = "name" | "total" | "date" | "status"

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  total: "Total",
  date: "Date",
  status: "Status",
}

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETE: 2,
}

export function OrderTable({
  orders,
  newOrderHref,
}: {
  orders: Order[]
  newOrderHref: string
}) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("date")

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((order) => {
        if (!q) return true
        if ((order.name ?? "").toLowerCase().includes(q)) return true
        if (order.id.toLowerCase().includes(q)) return true
        return false
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.name ?? "").localeCompare(b.name ?? "")
          case "total": {
            const aTotal = a.items.reduce((s, i) => s + i.priceAtOrder, 0)
            const bTotal = b.items.reduce((s, i) => s + i.priceAtOrder, 0)
            return aTotal - bTotal
          }
          case "date":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          case "status":
            return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        }
      })
  }, [orders, search, sortBy])

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
            Sort: {SORT_LABELS[sortBy]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortKey)}
            >
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="total">Total</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
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
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  {search ? "No orders match your search." : "No orders yet."}
                </TableCell>
              </TableRow>
            )}
            {displayed.map((order) => {
              const total = order.items.reduce(
                (s, i) => s + i.priceAtOrder,
                0
              )
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.name ?? "—"}
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
    </div>
  )
}
