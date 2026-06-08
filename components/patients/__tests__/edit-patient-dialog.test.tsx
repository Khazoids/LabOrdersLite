import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createContext, useContext } from "react"
import { EditPatientDialog } from "@/components/patients/edit-patient-dialog"

const mockUpdatePatient = vi.fn()
const mockRefresh = vi.fn()

vi.mock("@/lib/actions/patients", () => ({
  updatePatient: (...args: unknown[]) => mockUpdatePatient(...args),
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

const PATIENT = {
  id: "patient-1",
  name: "Jane Doe",
  dateOfBirth: new Date("1992-03-15"),
  email: "jane@example.com",
  phone: "555-9876",
  address: "123 Main St, Springfield, IL 62701",
}

function setup(overrides: Partial<typeof PATIENT> = {}) {
  const patient = { ...PATIENT, ...overrides }
  return { ...render(<EditPatientDialog patient={patient} />), user: userEvent.setup() }
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("dialog-trigger"))
  await screen.findByText("Edit Patient")
}

describe("EditPatientDialog", () => {
  afterEach(() => {
    mockUpdatePatient.mockReset()
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

  it("pre-populates First Name from patient.name", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("First Name")).toHaveValue("Jane")
  })

  it("pre-populates Last Name from patient.name", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("Last Name")).toHaveValue("Doe")
  })

  it("pre-populates Email", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com")
  })

  it("pre-populates Phone", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("Phone")).toHaveValue("555-9876")
  })

  it("pre-populates Street Address parsed from patient.address", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("Street Address")).toHaveValue("123 Main St")
  })

  it("pre-populates City parsed from patient.address", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("City")).toHaveValue("Springfield")
  })

  it("pre-populates State parsed from patient.address", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("State")).toHaveValue("IL")
  })

  it("pre-populates ZIP Code parsed from patient.address", async () => {
    const { user } = setup()
    await openDialog(user)
    expect(screen.getByLabelText("ZIP Code")).toHaveValue("62701")
  })

  it("handles null email and phone without crashing", async () => {
    const { user } = setup({ email: null, phone: null })
    await openDialog(user)
    expect(screen.getByLabelText("Email")).toHaveValue("")
    expect(screen.getByLabelText("Phone")).toHaveValue("")
  })

  it("handles null address without crashing", async () => {
    const { user } = setup({ address: null })
    await openDialog(user)
    expect(screen.getByLabelText("Street Address")).toHaveValue("")
    expect(screen.getByLabelText("City")).toHaveValue("")
  })

  it("calls updatePatient with the patient id on valid submission", async () => {
    mockUpdatePatient.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(mockUpdatePatient).toHaveBeenCalledOnce()
    const [id] = mockUpdatePatient.mock.calls[0] as [string, FormData]
    expect(id).toBe("patient-1")
  })

  it("passes updated field values in the FormData", async () => {
    mockUpdatePatient.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    const emailInput = screen.getByLabelText("Email")
    await user.clear(emailInput)
    await user.type(emailInput, "new@example.com")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    const [, fd] = mockUpdatePatient.mock.calls[0] as [string, FormData]
    expect(fd.get("email")).toBe("new@example.com")
  })

  it("calls router.refresh() on successful save", async () => {
    mockUpdatePatient.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await vi.waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce())
  })

  it("closes the dialog on successful save", async () => {
    mockUpdatePatient.mockResolvedValue({ success: true })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
  })

  it("shows a server error message when updatePatient returns failure", async () => {
    mockUpdatePatient.mockResolvedValue({ success: false, error: "Update failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("Update failed.")).toBeInTheDocument()
  })

  it("does not call router.refresh() when updatePatient returns failure", async () => {
    mockUpdatePatient.mockResolvedValue({ success: false, error: "Update failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await screen.findByText("Update failed.")
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("keeps dialog open when updatePatient returns failure", async () => {
    mockUpdatePatient.mockResolvedValue({ success: false, error: "Update failed." })
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await screen.findByText("Update failed.")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("does not call updatePatient when Cancel is clicked", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mockUpdatePatient).not.toHaveBeenCalled()
  })

  it("closes dialog when Cancel is clicked", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows 'Saving…' on the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockUpdatePatient.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeInTheDocument()
    resolve({ success: true })
  })

  it("disables the submit button while loading", async () => {
    let resolve!: (v: unknown) => void
    mockUpdatePatient.mockReturnValue(new Promise((r) => { resolve = r }))
    const { user } = setup()
    await openDialog(user)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled()
    resolve({ success: true })
  })

  it("shows validation error when First Name is cleared before submitting", async () => {
    const { user } = setup()
    await openDialog(user)
    await user.clear(screen.getByLabelText("First Name"))
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("First name is required.")).toBeInTheDocument()
    expect(mockUpdatePatient).not.toHaveBeenCalled()
  })

  it("shows validation error on blur when email is set to an invalid format", async () => {
    const { user } = setup()
    await openDialog(user)
    const emailInput = screen.getByLabelText("Email")
    await user.clear(emailInput)
    await user.type(emailInput, "not-an-email")
    fireEvent.blur(emailInput)
    expect(await screen.findByText("Email address is invalid.")).toBeInTheDocument()
  })

  it("resets fields to current patient data when dialog is re-opened after cancel", async () => {
    const { user } = setup()
    await openDialog(user)

    // Dirty a field, then cancel
    const emailInput = screen.getByLabelText("Email")
    await user.clear(emailInput)
    await user.type(emailInput, "dirty@example.com")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    // Re-open — field should be reset to original value
    await openDialog(user)
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com")
  })
})
