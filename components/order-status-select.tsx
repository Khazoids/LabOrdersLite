"use client"

import { useState } from "react"
import { OrderStatus } from "@/generated/prisma/enums"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/actions"

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
}

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (val: string) => {
    if (!val) return
    setError(null)
    const result = await updateOrderStatus(orderId, val as OrderStatus)
    if (!result.success) setError(result.error)
  }

  return (
    <div className="flex flex-col gap-1">
      <Select defaultValue={status} onValueChange={handleChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(OrderStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
