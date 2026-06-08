import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PatientTable } from "@/components/patients/patient-table"

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

const PATIENTS = [
  { id: "1", name: "Zoe Adams", dateOfBirth: new Date("1990-01-01"), email: "z@a.com", phone: null },
  { id: "2", name: "Alice Brown", dateOfBirth: new Date("1985-06-15"), email: null, phone: "555-1234" },
  { id: "3", name: "Mike Chen", dateOfBirth: new Date("1975-12-30"), email: "m@c.com", phone: null },
]

describe("PatientTable", () => {
  it("renders 'No patients yet.' when the list is empty", () => {
    render(<PatientTable patients={[]} />)
    expect(screen.getByText("No patients yet.")).toBeInTheDocument()
  })

  it("renders all patient names", () => {
    render(<PatientTable patients={PATIENTS} />)
    expect(screen.getByText("Zoe Adams")).toBeInTheDocument()
    expect(screen.getByText("Alice Brown")).toBeInTheDocument()
    expect(screen.getByText("Mike Chen")).toBeInTheDocument()
  })

  it("renders — for null email", () => {
    render(<PatientTable patients={PATIENTS} />)
    const dashes = screen.getAllByText("—")
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it("filters patients by name on search input (case-insensitive)", async () => {
    render(<PatientTable patients={PATIENTS} />)
    const input = screen.getByPlaceholderText("Search patients...")
    await userEvent.type(input, "alice")
    expect(screen.getByText("Alice Brown")).toBeInTheDocument()
    expect(screen.queryByText("Zoe Adams")).not.toBeInTheDocument()
    expect(screen.queryByText("Mike Chen")).not.toBeInTheDocument()
  })

  it("shows 'No patients match your search.' for zero results", async () => {
    render(<PatientTable patients={PATIENTS} />)
    const input = screen.getByPlaceholderText("Search patients...")
    await userEvent.type(input, "xxxxxxxx")
    expect(screen.getByText("No patients match your search.")).toBeInTheDocument()
  })

  it("clears the filter when the search is cleared", async () => {
    render(<PatientTable patients={PATIENTS} />)
    const input = screen.getByPlaceholderText("Search patients...")
    await userEvent.type(input, "alice")
    await userEvent.clear(input)
    expect(screen.getByText("Zoe Adams")).toBeInTheDocument()
    expect(screen.getByText("Alice Brown")).toBeInTheDocument()
    expect(screen.getByText("Mike Chen")).toBeInTheDocument()
  })

  it("sorts by first name ascending by default", () => {
    render(<PatientTable patients={PATIENTS} />)
    const rows = screen.getAllByRole("row").slice(1)
    const names = rows.map((r) => within(r).getByText(/Adams|Brown|Chen/).textContent)
    expect(names).toEqual(["Alice Brown", "Mike Chen", "Zoe Adams"])
  })

  it("sorts by last name when the Last Name radio is clicked", async () => {
    render(<PatientTable patients={PATIENTS} />)
    await userEvent.click(screen.getByRole("radio", { name: "Last Name" }))
    const rows = screen.getAllByRole("row").slice(1)
    const names = rows.map((r) => within(r).getByText(/Adams|Brown|Chen/).textContent)
    expect(names).toEqual(["Zoe Adams", "Alice Brown", "Mike Chen"])
  })

  it("sorts by date of birth when the Date of Birth radio is clicked", async () => {
    render(<PatientTable patients={PATIENTS} />)
    await userEvent.click(screen.getByRole("radio", { name: "Date of Birth" }))
    const rows = screen.getAllByRole("row").slice(1)
    const names = rows.map((r) => within(r).getByText(/Adams|Brown|Chen/).textContent)
    expect(names).toEqual(["Mike Chen", "Alice Brown", "Zoe Adams"])
  })
})
