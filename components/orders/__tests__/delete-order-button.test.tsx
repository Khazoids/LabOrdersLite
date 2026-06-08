import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"

const mockDeleteOrder = vi.fn()
vi.mock("@/lib/actions/orders", () => ({
  deleteOrder: (...args: unknown[]) => mockDeleteOrder(...args),
}))

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
    DialogTrigger: ({ children, render: renderProp }: any) => {
      const { setOpen } = useContext(Ctx)
      if (renderProp) {
        return (
          <button data-testid="dialog-trigger" onClick={() => setOpen(true)}>
            {children}
          </button>
        )
      }
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
    DialogClose: ({ children, render: renderProp, disabled }: any) => {
      const { setOpen } = useContext(Ctx)
      if (renderProp) {
        return (
          <button onClick={() => setOpen(false)} disabled={disabled}>
            {children}
          </button>
        )
      }
      return <button onClick={() => setOpen(false)} disabled={disabled}>{children}</button>
    },
  }
})

describe("DeleteOrderButton", () => {
  afterEach(() => mockDeleteOrder.mockReset())

  it("does not show dialog content initially", () => {
    render(<DeleteOrderButton orderId="order-1" />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens the confirmation dialog when the trigger is clicked", async () => {
    render(<DeleteOrderButton orderId="order-1" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Delete order?")).toBeInTheDocument()
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
  })

  it("closes the dialog on Cancel without calling deleteOrder", async () => {
    render(<DeleteOrderButton orderId="order-1" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(mockDeleteOrder).not.toHaveBeenCalled()
  })

  it("calls deleteOrder with the correct orderId on confirm", async () => {
    mockDeleteOrder.mockResolvedValue({ success: true })
    render(<DeleteOrderButton orderId="order-42" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(mockDeleteOrder).toHaveBeenCalledWith("order-42")
  })

  it("closes the dialog on successful deletion", async () => {
    mockDeleteOrder.mockResolvedValue({ success: true })
    render(<DeleteOrderButton orderId="order-1" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows an error message when deleteOrder fails", async () => {
    mockDeleteOrder.mockResolvedValue({ success: false, error: "Server error" })
    render(<DeleteOrderButton orderId="order-1" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.getByText("Server error")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows 'Deleting…' while the deletion is in progress", async () => {
    let resolve: (v: unknown) => void
    const promise = new Promise((r) => { resolve = r })
    mockDeleteOrder.mockReturnValue(promise)

    render(<DeleteOrderButton orderId="order-1" />)
    await userEvent.click(screen.getByTestId("dialog-trigger"))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByRole("button", { name: "Deleting…" })).toBeInTheDocument()
    resolve!({ success: true })
  })
})
