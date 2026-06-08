import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NewPatientForm } from "@/components/patients/new-patient-form"

const mockCreatePatient = vi.fn()
const mockPush = vi.fn()

vi.mock("@/lib/actions/patients", () => ({
  createPatient: (...args: unknown[]) => mockCreatePatient(...args),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

function setup() {
  return { ...render(<NewPatientForm />), user: userEvent.setup() }
}

async function fillAllFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First Name"), "Jane")
  await user.type(screen.getByLabelText("Last Name"), "Doe")
  // Date inputs in jsdom: fireEvent.change reliably sets the value and triggers
  // React's synthetic event system so Base UI picks it up via its onChange handler
  fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1992-03-15" } })
  await user.type(screen.getByLabelText("Email"), "jane@example.com")
  await user.type(screen.getByLabelText("Phone"), "555-9876")
  await user.type(screen.getByLabelText("Street Address"), "123 Main St")
  await user.type(screen.getByLabelText("City"), "Springfield")
  await user.type(screen.getByLabelText("State"), "IL")
  await user.type(screen.getByLabelText("Zip Code"), "62701")
}

describe("NewPatientForm", () => {
  afterEach(() => {
    mockCreatePatient.mockReset()
    mockPush.mockReset()
  })

  it("renders all required form fields", () => {
    setup()
    expect(screen.getByLabelText("First Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Date of Birth")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Phone")).toBeInTheDocument()
    expect(screen.getByLabelText("Street Address")).toBeInTheDocument()
    expect(screen.getByLabelText("City")).toBeInTheDocument()
    expect(screen.getByLabelText("State")).toBeInTheDocument()
    expect(screen.getByLabelText("Zip Code")).toBeInTheDocument()
  })

  it("does not show validation errors before any user interaction", () => {
    setup()
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
  })

  it("shows first name error when first name field is blurred while empty", async () => {
    const { user } = setup()
    await user.click(screen.getByLabelText("First Name"))
    await user.tab()
    expect(await screen.findByText("First name is required.")).toBeInTheDocument()
  })

  it("shows last name error when last name field is blurred while empty", async () => {
    const { user } = setup()
    await user.click(screen.getByLabelText("Last Name"))
    await user.tab()
    expect(await screen.findByText("Last name is required.")).toBeInTheDocument()
  })

  it("shows email error when email field is blurred with an invalid format", async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText("Email"), "not-an-email")
    fireEvent.blur(screen.getByLabelText("Email"))
    expect(await screen.findByText("Email address is invalid.")).toBeInTheDocument()
  })

  it("shows all field errors when the form is submitted with no input", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(await screen.findByText("First name is required.")).toBeInTheDocument()
    expect(screen.getByText("Last name is required.")).toBeInTheDocument()
    expect(screen.getByText("Date of birth is required.")).toBeInTheDocument()
    expect(screen.getByText("Email address is invalid.")).toBeInTheDocument()
    expect(screen.getByText("Phone is required.")).toBeInTheDocument()
    expect(screen.getByText("Street address is required.")).toBeInTheDocument()
    expect(screen.getByText("City is required.")).toBeInTheDocument()
    expect(screen.getByText("State is required.")).toBeInTheDocument()
    expect(screen.getByText("ZIP code is required.")).toBeInTheDocument()
  })

  it("does not call createPatient when the form has validation errors", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(mockCreatePatient).not.toHaveBeenCalled()
  })

  it("calls createPatient and navigates to / on successful submission", async () => {
    mockCreatePatient.mockResolvedValue({ success: true })
    const { user } = setup()
    await fillAllFields(user)
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(mockCreatePatient).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("shows a server error message when createPatient returns failure", async () => {
    mockCreatePatient.mockResolvedValue({ success: false, error: "Database error." })
    const { user } = setup()
    await fillAllFields(user)
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(await screen.findByText("Database error.")).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("shows 'Creating…' on the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockCreatePatient.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await fillAllFields(user)
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(screen.getByRole("button", { name: "Creating…" })).toBeInTheDocument()
    resolve({ success: true })
  })

  it("disables the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockCreatePatient.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await fillAllFields(user)
    await user.click(screen.getByRole("button", { name: "Create Patient" }))
    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled()
    resolve({ success: true })
  })
})
