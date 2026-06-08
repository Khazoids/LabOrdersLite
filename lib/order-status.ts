export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE"

export function getOrderStatus(createdAt: Date | string, maxTurnaroundDays: number): OrderStatus {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 86_400_000
  if (elapsed >= maxTurnaroundDays) return "COMPLETE"
  if (elapsed >= 1) return "IN_PROGRESS"
  return "PENDING"
}
