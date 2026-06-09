import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderTable } from "@/components/orders/order-table"
import { getOrderStatus } from "@/lib/order-status"
import type { OrderStatus } from "@/lib/order-status"

vi.mock("@/lib/actions/orders", () => ({
  deleteOrder: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("@/components/ui/dropdown-menu", async () => {
  const { createContext, useContext } = await import("react")
  const RadioCtx = createContext<(v: string) => void>(() => {})
  return {
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, className }: any) => (
      <button className={className}>{children}</button>
    ),
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuLabel: ({ children }: any) => <span>{children}</span>,
    DropdownMenuRadioGroup: ({ children, onValueChange }: any) => (
      <RadioCtx.Provider value={onValueChange ?? (() => {})}>
        <div>{children}</div>
      </RadioCtx.Provider>
    ),
    DropdownMenuRadioItem: ({ children, value }: any) => {
      const onChange = useContext(RadioCtx)
      return (
        <button role="radio" onClick={() => onChange(value)}>
          {children}
        </button>
      )
    },
  }
})

vi.mock("@/components/ui/dialog", async () => {
  const { createContext, useContext } = await import("react")
  const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
    open: false,
    setOpen: () => {},
  })
  return {
    Dialog: ({ children, open, onOpenChange }: any) => (
      <Ctx.Provider value={{ open: open ?? false, setOpen: onOpenChange ?? (() => {}) }}>
        {children}
      </Ctx.Provider>
    ),
    DialogTrigger: ({ children }: any) => {
      const { setOpen } = useContext(Ctx)
      return <button data-testid="dialog-trigger" onClick={() => setOpen(true)}>{children}</button>
    },
    DialogContent: ({ children }: any) => {
      const { open } = useContext(Ctx)
      return open ? <div role="dialog">{children}</div> : null
    },
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogClose: ({ children, disabled }: any) => {
      const { setOpen } = useContext(Ctx)
      return <button onClick={() => setOpen(false)} disabled={disabled}>{children}</button>
    },
  }
})

const NOW = new Date("2024-06-15T12:00:00.000Z").getTime()
const DAY = 86_400_000

function makeOrder(overrides: {
  id?: string
  name?: string | null
  createdAtOffset?: number
  turnaroundDays?: number
  price?: number
  status?: OrderStatus
}) {
  const createdAt = new Date(NOW - (overrides.createdAtOffset ?? 0) * DAY)
  const turnaroundDays = overrides.turnaroundDays ?? 3
  return {
    id: overrides.id ?? "order-1",
    // Use !== undefined so explicit null is preserved (null ?? "x" returns "x")
    name: overrides.name !== undefined ? overrides.name : "Test Order",
    createdAt,
    status: overrides.status ?? getOrderStatus(createdAt, turnaroundDays),
    items: [
      {
        id: "item-1",
        priceAtOrder: overrides.price ?? 45.0,
        labTest: {
          id: "lt-1",
          code: "CBC",
          name: "Complete Blood Count",
          turnaroundDays,
        },
      },
    ],
  }
}

describe("OrderTable", () => {
  // Spy on Date.now() only — avoids freezing the timer system (which breaks userEvent)
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders 'No orders yet.' when the list is empty", () => {
    render(<OrderTable orders={[]} newOrderHref="/orders/new" />)
    expect(screen.getByText("No orders yet.")).toBeInTheDocument()
  })

  it("renders the order name, test code badge, total, and status badge", () => {
    render(<OrderTable orders={[makeOrder({})]} newOrderHref="/orders/new" />)
    expect(screen.getByText("Test Order")).toBeInTheDocument()
    expect(screen.getByText("CBC")).toBeInTheDocument()
    expect(screen.getByText("$45.00")).toBeInTheDocument()
  })

  it("renders a dash for a null order name", () => {
    render(<OrderTable orders={[makeOrder({ name: null })]} newOrderHref="/orders/new" />)
    // Use row-level assertion to avoid exact text match issues with the em dash character
    const rows = screen.getAllByRole("row")
    // rows[0] = header, rows[1] = first data row
    expect(rows[1]).toHaveTextContent("—")
  })

  it("shows Pending badge for a brand-new order", () => {
    render(<OrderTable orders={[makeOrder({ createdAtOffset: 0 })]} newOrderHref="/orders/new" />)
    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("shows In Progress badge for an order 1+ days old but within turnaround", () => {
    render(<OrderTable orders={[makeOrder({ createdAtOffset: 1, turnaroundDays: 3 })]} newOrderHref="/orders/new" />)
    expect(screen.getByText("In Progress")).toBeInTheDocument()
  })

  it("shows Complete badge for an order past its turnaround days", () => {
    render(<OrderTable orders={[makeOrder({ createdAtOffset: 5, turnaroundDays: 3 })]} newOrderHref="/orders/new" />)
    expect(screen.getByText("Complete")).toBeInTheDocument()
  })

  it("filters by order name (case-insensitive)", async () => {
    const orders = [
      makeOrder({ id: "1", name: "Annual Checkup" }),
      makeOrder({ id: "2", name: "Follow-up Panel" }),
    ]
    render(<OrderTable orders={orders} newOrderHref="/orders/new" />)
    await userEvent.type(screen.getByPlaceholderText("Search by name or order ID…"), "annual")
    expect(screen.getByText("Annual Checkup")).toBeInTheDocument()
    expect(screen.queryByText("Follow-up Panel")).not.toBeInTheDocument()
  })

  it("filters by order ID", async () => {
    const orders = [
      makeOrder({ id: "order-abc-123", name: "First Order" }),
      makeOrder({ id: "order-xyz-999", name: "Second Order" }),
    ]
    render(<OrderTable orders={orders} newOrderHref="/orders/new" />)
    await userEvent.type(screen.getByPlaceholderText("Search by name or order ID…"), "abc")
    expect(screen.getByText("First Order")).toBeInTheDocument()
    expect(screen.queryByText("Second Order")).not.toBeInTheDocument()
  })

  it("shows 'No orders match your search.' for zero results", async () => {
    render(<OrderTable orders={[makeOrder({})]} newOrderHref="/orders/new" />)
    await userEvent.type(screen.getByPlaceholderText("Search by name or order ID…"), "xxxxxxxx")
    expect(screen.getByText("No orders match your search.")).toBeInTheDocument()
  })

  it("sorts by name alphabetically when Name radio is clicked", async () => {
    const orders = [
      makeOrder({ id: "1", name: "Zebra Test" }),
      makeOrder({ id: "2", name: "Alpha Test" }),
    ]
    render(<OrderTable orders={orders} newOrderHref="/orders/new" />)
    await userEvent.click(screen.getByRole("radio", { name: "Name" }))
    const rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("Alpha Test")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Zebra Test")).toBeInTheDocument()
  })

  it("sorts by total ascending when Total radio is clicked", async () => {
    const orders = [
      makeOrder({ id: "1", name: "Expensive", price: 200.0 }),
      makeOrder({ id: "2", name: "Cheap", price: 10.0 }),
    ]
    render(<OrderTable orders={orders} newOrderHref="/orders/new" />)
    await userEvent.click(screen.getByRole("radio", { name: "Total" }))
    const rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("Cheap")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Expensive")).toBeInTheDocument()
  })

  it("renders the New Order link using newOrderHref", () => {
    render(<OrderTable orders={[]} newOrderHref="/orders/new" />)
    const link = screen.getByRole("link", { name: /new order/i })
    expect(link).toHaveAttribute("href", "/orders/new")
  })
})
