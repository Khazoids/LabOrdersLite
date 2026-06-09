"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updatePatient } from "@/lib/actions/patients"
import { EMAIL_RE } from "@/lib/utils"

type PatientData = {
  id: string
  name: string
  dateOfBirth: Date | string
  email: string | null
  phone: string | null
  address: string | null
}

type Fields = {
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phone: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const errs: Partial<Record<keyof Fields, string>> = {}
  if (!f.firstName.trim()) errs.firstName = "First name is required."
  if (!f.lastName.trim()) errs.lastName = "Last name is required."
  if (!f.dateOfBirth) {
    errs.dateOfBirth = "Date of birth is required."
  } else {
    const d = new Date(f.dateOfBirth)
    if (isNaN(d.getTime())) errs.dateOfBirth = "Date of birth is invalid."
    else if (d > new Date()) errs.dateOfBirth = "Date of birth cannot be in the future."
  }
  if (!EMAIL_RE.test(f.email.trim())) errs.email = "Email address is invalid."
  if (!f.phone.trim()) errs.phone = "Phone is required."
  if (!f.streetAddress.trim()) errs.streetAddress = "Street address is required."
  if (!f.city.trim()) errs.city = "City is required."
  if (!f.state.trim()) errs.state = "State is required."
  if (!f.zipCode.trim()) errs.zipCode = "ZIP code is required."
  return errs
}

function toFields(patient: PatientData): Fields {
  const spaceIdx = patient.name.indexOf(" ")
  const firstName = spaceIdx === -1 ? patient.name : patient.name.slice(0, spaceIdx)
  const lastName = spaceIdx === -1 ? "" : patient.name.slice(spaceIdx + 1)

  const addr = patient.address ?? ""
  const parts = addr.split(", ")
  const streetAddress = parts[0] ?? ""
  const city = parts[1] ?? ""
  const stateZip = parts[2] ?? ""
  const lastSpace = stateZip.lastIndexOf(" ")
  const state = lastSpace !== -1 ? stateZip.slice(0, lastSpace) : stateZip
  const zipCode = lastSpace !== -1 ? stateZip.slice(lastSpace + 1) : ""

  const dob = new Date(patient.dateOfBirth)
  const dateOfBirth = isNaN(dob.getTime()) ? "" : dob.toISOString().slice(0, 10)

  return {
    firstName,
    lastName,
    dateOfBirth,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    streetAddress,
    city,
    state,
    zipCode,
  }
}

export function EditPatientDialog({ patient }: { patient: PatientData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<Fields>(() => toFields(patient))
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function set(field: keyof Fields) {
    return (value: string) => setFields((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field: keyof Fields) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate(fields))
  }

  function handleOpenChange(nextOpen: boolean) {
    if (loading) return
    if (nextOpen) {
      setFields(toFields(patient))
      setTouched({})
      setErrors({})
      setServerError(null)
    }
    setOpen(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allTouched = Object.fromEntries(
      (Object.keys(fields) as (keyof Fields)[]).map((k) => [k, true])
    ) as Record<keyof Fields, boolean>
    setTouched(allTouched)
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setServerError(null)

    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)

    const result = await updatePatient(patient.id, fd)
    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      setServerError(result.error)
      setLoading(false)
    }
  }

  function fieldError(field: keyof Fields) {
    return touched[field] && errors[field] ? errors[field] : undefined
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ep-firstName">First Name</Label>
              <Input
                id="ep-firstName"
                value={fields.firstName}
                onValueChange={set("firstName")}
                onBlur={() => handleBlur("firstName")}
                aria-invalid={!!fieldError("firstName")}
              />
              {fieldError("firstName") && (
                <p className="text-sm text-destructive">{fieldError("firstName")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-lastName">Last Name</Label>
              <Input
                id="ep-lastName"
                value={fields.lastName}
                onValueChange={set("lastName")}
                onBlur={() => handleBlur("lastName")}
                aria-invalid={!!fieldError("lastName")}
              />
              {fieldError("lastName") && (
                <p className="text-sm text-destructive">{fieldError("lastName")}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-dateOfBirth">Date of Birth</Label>
            <Input
              id="ep-dateOfBirth"
              type="date"
              value={fields.dateOfBirth}
              onValueChange={set("dateOfBirth")}
              onBlur={() => handleBlur("dateOfBirth")}
              aria-invalid={!!fieldError("dateOfBirth")}
            />
            {fieldError("dateOfBirth") && (
              <p className="text-sm text-destructive">{fieldError("dateOfBirth")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-email">Email</Label>
            <Input
              id="ep-email"
              type="email"
              value={fields.email}
              onValueChange={set("email")}
              onBlur={() => handleBlur("email")}
              aria-invalid={!!fieldError("email")}
            />
            {fieldError("email") && (
              <p className="text-sm text-destructive">{fieldError("email")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-phone">Phone</Label>
            <Input
              id="ep-phone"
              type="tel"
              value={fields.phone}
              onValueChange={set("phone")}
              onBlur={() => handleBlur("phone")}
              aria-invalid={!!fieldError("phone")}
            />
            {fieldError("phone") && (
              <p className="text-sm text-destructive">{fieldError("phone")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-streetAddress">Street Address</Label>
            <Input
              id="ep-streetAddress"
              value={fields.streetAddress}
              onValueChange={set("streetAddress")}
              onBlur={() => handleBlur("streetAddress")}
              aria-invalid={!!fieldError("streetAddress")}
            />
            {fieldError("streetAddress") && (
              <p className="text-sm text-destructive">{fieldError("streetAddress")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="ep-city">City</Label>
              <Input
                id="ep-city"
                value={fields.city}
                onValueChange={set("city")}
                onBlur={() => handleBlur("city")}
                aria-invalid={!!fieldError("city")}
              />
              {fieldError("city") && (
                <p className="text-sm text-destructive">{fieldError("city")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-state">State</Label>
              <Input
                id="ep-state"
                placeholder="IL"
                value={fields.state}
                onValueChange={set("state")}
                onBlur={() => handleBlur("state")}
                aria-invalid={!!fieldError("state")}
              />
              {fieldError("state") && (
                <p className="text-sm text-destructive">{fieldError("state")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-zipCode">ZIP Code</Label>
              <Input
                id="ep-zipCode"
                placeholder="62701"
                value={fields.zipCode}
                onValueChange={set("zipCode")}
                onBlur={() => handleBlur("zipCode")}
                aria-invalid={!!fieldError("zipCode")}
              />
              {fieldError("zipCode") && (
                <p className="text-sm text-destructive">{fieldError("zipCode")}</p>
              )}
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" disabled={loading} />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-patient-form" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
