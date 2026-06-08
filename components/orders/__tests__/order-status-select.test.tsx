import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderStatusSelect } from "@/components/orders/order-status-select"
import { OrderStatus } from "@/generated/prisma/enums"

const mockUpdateOrderStatus = vi.fn()
vi.mock("@/lib/actions/orders", () => ({
  updateOrderStatus: (...args: unknown[]) => mockUpdateOrderStatus(...args),
}))

vi.mock("@/components/ui/select", async () => {
  const { createContext, useContext } = await import("react")
  const Ctx = createContext<(v: string) => void>(() => {})
  return {
    Select: ({ children, defaultValue, onValueChange }: any) => (
      <Ctx.Provider value={onValueChange ?? (() => {})}>
        <div data-default={defaultValue}>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => {
      const onChange = useContext(Ctx)
      return (
        <button role="option" data-value={value} onClick={() => onChange(value)}>
          {children}
        </button>
      )
    },
    SelectLabel: ({ children }: any) => <span>{children}</span>,
    SelectGroup: ({ children }: any) => <>{children}</>,
    SelectSeparator: () => <hr />,
  }
})

describe("OrderStatusSelect", () => {
  afterEach(() => mockUpdateOrderStatus.mockReset())

  it("renders option buttons for all three statuses", () => {
    render(<OrderStatusSelect orderId="order-1" status={OrderStatus.PENDING} />)
    expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "In Progress" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Complete" })).toBeInTheDocument()
  })

  it("calls updateOrderStatus with the correct orderId and new status when an option is clicked", async () => {
    mockUpdateOrderStatus.mockResolvedValue({ success: true })
    render(<OrderStatusSelect orderId="order-42" status={OrderStatus.PENDING} />)
    await userEvent.click(screen.getByRole("option", { name: "In Progress" }))
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith("order-42", OrderStatus.IN_PROGRESS)
  })

  it("shows an error message when updateOrderStatus fails", async () => {
    mockUpdateOrderStatus.mockResolvedValue({ success: false, error: "Update failed" })
    render(<OrderStatusSelect orderId="order-1" status={OrderStatus.PENDING} />)
    await userEvent.click(screen.getByRole("option", { name: "Complete" }))
    expect(await screen.findByText("Update failed")).toBeInTheDocument()
  })

  it("clears the error message on a subsequent successful change", async () => {
    mockUpdateOrderStatus
      .mockResolvedValueOnce({ success: false, error: "First failure" })
      .mockResolvedValueOnce({ success: true })

    render(<OrderStatusSelect orderId="order-1" status={OrderStatus.PENDING} />)
    await userEvent.click(screen.getByRole("option", { name: "Complete" }))
    expect(await screen.findByText("First failure")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("option", { name: "In Progress" }))
    expect(screen.queryByText("First failure")).not.toBeInTheDocument()
  })
})
