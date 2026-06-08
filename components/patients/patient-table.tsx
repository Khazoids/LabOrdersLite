"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientRow } from "@/components/patients/patient-row"

type Patient = {
  id: string
  name: string
  dateOfBirth: Date
  email: string | null
  phone: string | null
}

type SortKey = "firstName" | "lastName" | "dateOfBirth"

const SORT_LABELS: Record<SortKey, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  dateOfBirth: "Date of Birth",
}

export function PatientTable({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("firstName")

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return patients
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "firstName") {
          return a.name.split(" ")[0].localeCompare(b.name.split(" ")[0])
        }
        if (sortBy === "lastName") {
          const aLast = a.name.split(" ").at(-1) ?? ""
          const bLast = b.name.split(" ").at(-1) ?? ""
          return aLast.localeCompare(bLast)
        }
        return (
          new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime()
        )
      })
  }, [patients, search, sortBy])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search patients..."
            value={search}
            onValueChange={setSearch}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {SORT_LABELS[sortBy]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortKey)}
            >
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioItem value="firstName">
                First Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lastName">
                Last Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dateOfBirth">
                Date of Birth
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12"
                >
                  {search ? "No patients match your search." : "No patients yet."}
                </TableCell>
              </TableRow>
            )}
            {displayed.map((patient) => (
              <PatientRow key={patient.id} patient={patient} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
