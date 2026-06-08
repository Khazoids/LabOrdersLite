import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/ui/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPatient } from "@/lib/actions/patients"

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={
        <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      } />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>New Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPatient} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Full name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required />
              </div>
              <Button type="submit" className="w-full">Create Patient</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
