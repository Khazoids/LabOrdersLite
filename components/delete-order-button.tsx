"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteOrder } from "@/lib/actions"

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm("Delete this order?")) return
    setError(null)
    const result = await deleteOrder(orderId)
    if (!result.success) setError(result.error)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
