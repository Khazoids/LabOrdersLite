import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NewOrderForm } from "@/components/orders/new-order-form"

const mockCreateOrder = vi.fn()
const mockPush = vi.fn()

vi.mock("@/lib/actions/orders", () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/components/ui/select", async () => {
  const { createContext, useContext } = await import("react")
  const Ctx = createContext<(v: string) => void>(() => {})
  return {
    Select: ({ children, value, onValueChange }: any) => (
      <Ctx.Provider value={onValueChange ?? (() => {})}>
        <div data-value={value}>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
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

const PATIENTS = [
  { id: "pat-1", name: "John Smith", dateOfBirth: new Date(), email: null, phone: null, address: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "pat-2", name: "Jane Doe", dateOfBirth: new Date(), email: null, phone: null, address: null, createdAt: new Date(), updatedAt: new Date() },
]

const LAB_TESTS = [
  { id: "lt-1", code: "CBC", name: "Complete Blood Count", price: 45.0, turnaroundDays: 1 },
  { id: "lt-2", code: "CMP", name: "Comprehensive Metabolic Panel", price: 65.0, turnaroundDays: 1 },
]

function setup() {
  const utils = render(<NewOrderForm patients={PATIENTS} labTests={LAB_TESTS} />)
  return { ...utils, user: userEvent.setup() }
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("e.g. Annual Checkup"), "My Order")
  await user.click(screen.getByRole("option", { name: "John Smith" }))
  await user.click(screen.getByRole("button", { name: /complete blood count/i }))
}

describe("NewOrderForm", () => {
  afterEach(() => {
    mockCreateOrder.mockReset()
    mockPush.mockReset()
  })

  it("renders the order name input, patient select, and lab test list", () => {
    setup()
    expect(screen.getByPlaceholderText("e.g. Annual Checkup")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "John Smith" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /complete blood count/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /comprehensive metabolic panel/i })).toBeInTheDocument()
  })

  it("submit button is disabled when no fields are filled", () => {
    setup()
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled()
  })

  it("submit button is disabled with only name filled", async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText("e.g. Annual Checkup"), "My Order")
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled()
  })

  it("submit button is disabled with name and patient but no tests selected", async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText("e.g. Annual Checkup"), "My Order")
    await user.click(screen.getByRole("option", { name: "John Smith" }))
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled()
  })

  it("submit button is enabled when all fields are filled", async () => {
    const { user } = setup()
    await fillValidForm(user)
    expect(screen.getByRole("button", { name: "Create Order" })).toBeEnabled()
  })

  it("selecting a lab test shows it in the order summary", async () => {
    const { user } = setup()
    expect(screen.queryByText("Order Summary")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /complete blood count/i }))
    const summary = screen.getByText("Order Summary").closest("div")!
    expect(within(summary).getByText("CBC")).toBeInTheDocument()
    // $45.00 also appears in the test list, so scope to the summary section
    expect(within(summary).getAllByText("$45.00").length).toBeGreaterThan(0)
  })

  it("deselecting a lab test removes it from the order summary", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /complete blood count/i }))
    await user.click(screen.getByRole("button", { name: /complete blood count/i }))
    expect(screen.queryByText("Order Summary")).not.toBeInTheDocument()
  })

  it("shows the correct running total for multiple selected tests", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /complete blood count/i }))
    await user.click(screen.getByRole("button", { name: /comprehensive metabolic panel/i }))
    const summary = screen.getByText("Order Summary").closest("div")!
    expect(within(summary).getByText("$110.00")).toBeInTheDocument()
  })

  it("calls createOrder with patientId, name, and selected labTestIds on submit", async () => {
    mockCreateOrder.mockResolvedValue({ success: true })
    const { user } = setup()
    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Create Order" }))
    expect(mockCreateOrder).toHaveBeenCalledWith("pat-1", "My Order", ["lt-1"])
  })

  it("calls router.push('/') on successful submission", async () => {
    mockCreateOrder.mockResolvedValue({ success: true })
    const { user } = setup()
    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Create Order" }))
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("shows an error message when createOrder fails", async () => {
    mockCreateOrder.mockResolvedValue({ success: false, error: "Something went wrong" })
    const { user } = setup()
    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Create Order" }))
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("shows 'Creating…' on the submit button while the request is in progress", async () => {
    let resolve: (v: unknown) => void
    const promise = new Promise((r) => { resolve = r })
    mockCreateOrder.mockReturnValue(promise)

    const { user } = setup()
    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: "Create Order" }))

    expect(screen.getByRole("button", { name: "Creating…" })).toBeInTheDocument()
    resolve!({ success: true })
  })
})
