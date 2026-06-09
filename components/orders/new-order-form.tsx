"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createOrder } from "@/lib/actions/orders"
import type { Patient } from "@/generated/prisma/client"

type LabTest = {
  id: string
  code: string
  name: string
  price: number
  turnaroundDays: number
}

export function NewOrderForm({
  patients,
  labTests,
}: {
  patients: Patient[]
  labTests: LabTest[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [patientId, setPatientId] = useState("")
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [patientError, setPatientError] = useState<string | null>(null)
  const [testsError, setTestsError] = useState<string | null>(null)

  const toggleTest = (id: string) =>
    setSelectedTests((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
      if (next.length > 0) setTestsError(null)
      return next
    })

  const selectedLabTests = labTests.filter((t) => selectedTests.includes(t.id))
  const total = selectedLabTests.reduce((s, t) => s + t.price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameErr = !name.trim() ? "Order name is required." : null
    const patientErr = !patientId ? "Please select a patient." : null
    const testsErr = selectedTests.length === 0 ? "Please select at least one test." : null
    setNameError(nameErr)
    setPatientError(patientErr)
    setTestsError(testsErr)
    if (nameErr || patientErr || testsErr) return
    setLoading(true)
    setError(null)
    const result = await createOrder(patientId, name.trim(), selectedTests)
    if (result.success) {
      router.push("/")
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold">New Order</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Order Name</Label>
        <Input
          id="name"
          placeholder="e.g. Annual Checkup"
          value={name}
          onValueChange={(v) => { setName(v); if (v.trim()) setNameError(null) }}
          aria-invalid={!!nameError}
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient">Patient</Label>
        <Select
          value={patientId}
          onValueChange={(val) => { if (val) { setPatientId(val); setPatientError(null) } }}
          items={patients.map((p) => ({ value: p.id, label: p.name }))}
        >
          <SelectTrigger id="patient">
            <SelectValue placeholder="Select a patient…" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {patientError && <p className="text-sm text-destructive">{patientError}</p>}
      </div>

      <div className="space-y-2">
        <Label>Lab Tests</Label>
        <div className="rounded-lg border divide-y" role="group" aria-label="Lab tests">
          {labTests.map((test) => {
            const selected = selectedTests.includes(test.id)
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => toggleTest(test.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  selected ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selected && (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{test.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {test.code} · {test.turnaroundDays}d turnaround
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  ${test.price.toFixed(2)}
                </span>
              </button>
            )
          })}
        </div>
        {testsError && <p className="text-sm text-destructive">{testsError}</p>}
      </div>

      {selectedLabTests.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Order Summary</p>
          <div className="flex flex-wrap gap-1">
            {selectedLabTests.map((t) => (
              <Badge key={t.id} variant="secondary">
                {t.code}
              </Badge>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || !name.trim() || !patientId || selectedTests.length === 0}
        className="w-full"
      >
        {loading ? "Creating…" : "Create Order"}
      </Button>
    </form>
  )
}
