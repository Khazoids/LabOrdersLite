import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createContext, useContext } from "react"
import { EditOrderDialog } from "@/components/orders/edit-order-dialog"

const mockUpdateOrder = vi.fn()
const mockRefresh = vi.fn()

vi.mock("@/lib/actions/orders", () => ({
  updateOrder: (...args: unknown[]) => mockUpdateOrder(...args),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: mockRefresh,
  }),
}))

const DialogCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <DialogCtx.Provider value={{ open: open ?? false, setOpen: onOpenChange ?? (() => {}) }}>
      {children}
    </DialogCtx.Provider>
  ),
  DialogTrigger: ({ children, render: _render }: any) => {
    const { setOpen } = useContext(DialogCtx)
    return (
      <button data-testid="dialog-trigger" onClick={() => setOpen(true)}>
        {children}
      </button>
    )
  },
  DialogContent: ({ children }: any) => {
    const { open } = useContext(DialogCtx)
    return open ? <div role="dialog">{children}</div> : null
  },
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogClose: ({ children, render: _render, disabled }: any) => {
    const { setOpen } = useContext(DialogCtx)
    return (
      <button onClick={() => setOpen(false)} disabled={disabled}>
        {children}
      </button>
    )
  },
}))

function setup(orderId = "order-1", orderName: string | null = "Annual Checkup") {
  return {
    ...render(<EditOrderDialog orderId={orderId} orderName={orderName} />),
    user: userEvent.setup(),
  }
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("dialog-trigger"))
  await screen.findByText("Edit Order")
}

describe("EditOrderDialog", () => {
  afterEach(() => {
    mockUpdateOrder.mockReset()
    mockRefresh.mockReset()
  })

  it("renders an Edit trigger button", () => {
    setup()
    expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument()
  })

  it("dialog is not open before trigger is clicked", () => {
    setup()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens dialog when the trigger button is clicked", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("pre-populates order name field with the current order name", async () => {
    const { user } = setup("order-1", "Annual Checkup")
    await openDialog(user)
    expect(screen.getByLabelText("Order Name")).toHaveValue("Annual Checkup")
  })

  it("uses empty string when orderName is null", async () => {
    const { user } = setup("order-1", null)
    await openDialog(user)
    expect(screen.getByLabelText("Order Name")).toHaveValue("")
  })

  it("calls updateOrder with the order id and new name on submission", async () => {
    mockUpdateOrder.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    const input = screen.getByLabelText("Order Name")
    await user.clear(input)
    await user.type(input, "Updated Name")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(mockUpdateOrder).toHaveBeenCalledWith("order-1", "Updated Name")
  })

  it("calls router.refresh() on successful save", async () => {
    mockUpdateOrder.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await vi.waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce())
  })

  it("closes dialog on successful save", async () => {
    mockUpdateOrder.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
  })

  it("shows a server error message when updateOrder returns failure", async () => {
    mockUpdateOrder.mockResolvedValue({ success: false, error: "Save failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("Save failed.")).toBeInTheDocument()
  })

  it("does not call router.refresh() when updateOrder returns failure", async () => {
    mockUpdateOrder.mockResolvedValue({ success: false, error: "Save failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await screen.findByText("Save failed.")
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("keeps dialog open when updateOrder returns failure", async () => {
    mockUpdateOrder.mockResolvedValue({ success: false, error: "Save failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await screen.findByText("Save failed.")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("Save Changes button is disabled when name is empty", async () => {
    const { user } = setup("order-1", null)
    await openDialog(user)
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled()
  })

  it("Save Changes button is disabled when name is cleared", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.clear(screen.getByLabelText("Order Name"))
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled()
  })

  it("does not call updateOrder when Cancel is clicked", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mockUpdateOrder).not.toHaveBeenCalled()
  })

  it("closes dialog when Cancel is clicked", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows 'Saving…' on the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockUpdateOrder.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeInTheDocument()
    resolve({ success: true })
  })

  it("disables the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockUpdateOrder.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled()
    resolve({ success: true })
  })

  it("resets name to current orderName when dialog is re-opened after cancel", async () => {
    const { user } = setup("order-1", "Annual Checkup")
    await openDialog(user)

    const input = screen.getByLabelText("Order Name")
    await user.clear(input)
    await user.type(input, "Dirty Value")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await openDialog(user)
    expect(screen.getByLabelText("Order Name")).toHaveValue("Annual Checkup")
  })
})
