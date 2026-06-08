"use client"

import { useRouter } from "next/navigation"
import { TableRow, TableCell } from "@/components/ui/table"

type Patient = {
  id: string
  name: string
  dateOfBirth: Date
  email: string | null
  phone: string | null
}

export function PatientRow({ patient }: { patient: Patient }) {
  const router = useRouter()

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/patients/${patient.id}`)}
    >
      <TableCell className="font-medium">{patient.name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(patient.dateOfBirth).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {patient.email ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {patient.phone ?? "—"}
      </TableCell>
    </TableRow>
  )
}
