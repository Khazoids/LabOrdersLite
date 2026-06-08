import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PatientRow } from "@/components/patients/patient-row"
import {
  Table,
  TableBody,
} from "@/components/ui/table"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

function renderRow(overrides: Partial<Parameters<typeof PatientRow>[0]["patient"]> = {}) {
  const patient = {
    id: "pat-1",
    name: "John Smith",
    dateOfBirth: new Date("1980-05-20"),
    email: "john@example.com",
    phone: "(555) 000-1111",
    ...overrides,
  }
  return render(
    <Table>
      <TableBody>
        <PatientRow patient={patient} />
      </TableBody>
    </Table>
  )
}

describe("PatientRow", () => {
  afterEach(() => mockPush.mockClear())

  it("renders the patient name", () => {
    renderRow()
    expect(screen.getByText("John Smith")).toBeInTheDocument()
  })

  it("renders the patient email", () => {
    renderRow()
    expect(screen.getByText("john@example.com")).toBeInTheDocument()
  })

  it("renders the patient phone", () => {
    renderRow()
    expect(screen.getByText("(555) 000-1111")).toBeInTheDocument()
  })

  it("renders — for a null email", () => {
    renderRow({ email: null })
    const dashes = screen.getAllByText("—")
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it("renders — for a null phone", () => {
    renderRow({ phone: null })
    const dashes = screen.getAllByText("—")
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it("navigates to /patients/[id] on row click", async () => {
    renderRow()
    const row = screen.getByText("John Smith").closest("tr")!
    await userEvent.click(row)
    expect(mockPush).toHaveBeenCalledWith("/patients/pat-1")
  })

  it("formats dateOfBirth as a locale date string", () => {
    renderRow({ dateOfBirth: new Date("1980-05-20") })
    const formatted = new Date("1980-05-20").toLocaleDateString()
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })
})
