"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPatient } from "@/lib/actions/patients"
import { EMAIL_RE } from "@/lib/utils"

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

const EMPTY: Fields = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
}

export function NewPatientForm() {
  const router = useRouter()
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function set(field: keyof Fields) {
    return (value: string) => setFields((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field: keyof Fields) {
    const nextTouched = { ...touched, [field]: true }
    setTouched(nextTouched)
    setErrors(validate(fields))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allTouched = Object.fromEntries(
      Object.keys(EMPTY).map((k) => [k, true])
    ) as Record<keyof Fields, boolean>
    setTouched(allTouched)
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setServerError(null)

    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)

    const result = await createPatient(fd)
    if (result.success) {
      setLoading(false)
      router.push("/")
    } else {
      setServerError(result.error)
      setLoading(false)
    }
  }

  function fieldError(field: keyof Fields) {
    return touched[field] && errors[field] ? errors[field] : undefined
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Jane"
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
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
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
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
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
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
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
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input
          id="streetAddress"
          name="streetAddress"
          placeholder="123 Main St"
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
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
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
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
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
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
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

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create Patient"}
      </Button>
    </form>
  )
}
