import { getOrderStatus } from "@/lib/order-status"

const NOW = new Date("2024-06-15T12:00:00.000Z").getTime()
const DAY = 86_400_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("getOrderStatus", () => {
  it("returns PENDING when order was just created", () => {
    expect(getOrderStatus(new Date(NOW), 5)).toBe("PENDING")
  })

  it("returns PENDING when elapsed time is less than 1 day", () => {
    const createdAt = new Date(NOW - 23 * 60 * 60 * 1000)
    expect(getOrderStatus(createdAt, 5)).toBe("PENDING")
  })

  it("returns IN_PROGRESS when elapsed time is exactly 1 day", () => {
    const createdAt = new Date(NOW - DAY)
    expect(getOrderStatus(createdAt, 5)).toBe("IN_PROGRESS")
  })

  it("returns IN_PROGRESS when elapsed is between 1 day and turnaroundDays", () => {
    const createdAt = new Date(NOW - 3 * DAY)
    expect(getOrderStatus(createdAt, 5)).toBe("IN_PROGRESS")
  })

  it("returns COMPLETE when elapsed time equals turnaroundDays", () => {
    const createdAt = new Date(NOW - 5 * DAY)
    expect(getOrderStatus(createdAt, 5)).toBe("COMPLETE")
  })

  it("returns COMPLETE when elapsed time exceeds turnaroundDays", () => {
    const createdAt = new Date(NOW - 10 * DAY)
    expect(getOrderStatus(createdAt, 5)).toBe("COMPLETE")
  })

  it("returns COMPLETE for turnaroundDays=1 when elapsed >= 1 day (boundary: COMPLETE takes precedence over IN_PROGRESS)", () => {
    const createdAt = new Date(NOW - DAY)
    expect(getOrderStatus(createdAt, 1)).toBe("COMPLETE")
  })

  it("accepts an ISO string for createdAt", () => {
    const isoString = new Date(NOW - 3 * DAY).toISOString()
    expect(getOrderStatus(isoString, 5)).toBe("IN_PROGRESS")
  })

  it("accepts a Date object for createdAt", () => {
    const date = new Date(NOW - 3 * DAY)
    expect(getOrderStatus(date, 5)).toBe("IN_PROGRESS")
  })

  it("returns COMPLETE for turnaroundDays=0 even when just created (elapsed=0 >= maxTurnaroundDays=0)", () => {
    expect(getOrderStatus(new Date(NOW), 0)).toBe("COMPLETE")
  })

  it("returns COMPLETE for turnaroundDays=0 when 1+ day has elapsed", () => {
    const createdAt = new Date(NOW - DAY)
    expect(getOrderStatus(createdAt, 0)).toBe("COMPLETE")
  })
})
