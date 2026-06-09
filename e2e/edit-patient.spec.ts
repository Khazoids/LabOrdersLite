import { test, expect } from "./fixtures/db-fixture"
import type { Page } from "@playwright/test"

async function createPatient(page: Page) {
  await page.goto("/patients/new")
  await page.getByLabel("First Name").fill("Edit")
  await page.getByLabel("Last Name").fill("Target")
  await page.getByLabel("Date of Birth").fill("1985-06-15")
  await page.getByLabel("Email").fill("edit.target@example.com")
  await page.getByLabel("Phone").fill("555-1234")
  await page.getByLabel("Street Address").fill("100 Original St")
  await page.getByLabel("City").fill("Springfield")
  await page.getByLabel("State").fill("IL")
  await page.getByLabel("Zip Code").fill("62701")
  await page.getByRole("button", { name: "Create Patient" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("Edit patient", () => {
  test("Edit button is visible on the patient detail page", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await expect(page.getByRole("button", { name: /edit/i })).toBeVisible()
  })

  test("clicking Edit opens a dialog pre-filled with the patient's data", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await expect(page.getByLabel("First Name")).toHaveValue("Edit")
    await expect(page.getByLabel("Last Name")).toHaveValue("Target")
    await expect(page.getByLabel("Email")).toHaveValue("edit.target@example.com")
    await expect(page.getByLabel("Phone")).toHaveValue("555-1234")
    await expect(page.getByLabel("Street Address")).toHaveValue("100 Original St")
    await expect(page.getByLabel("City")).toHaveValue("Springfield")
    await expect(page.getByLabel("State")).toHaveValue("IL")
    await expect(page.getByLabel("Zip Code")).toHaveValue("62701")
  })

  test("saving a name change updates the patient name on the page", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("First Name").fill("Updated")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("Updated Target").first()).toBeVisible()
  })

  test("saving an email change updates the email on the page", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("Email").fill("updated@example.com")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("updated@example.com")).toBeVisible()
  })

  test("dialog closes after a successful save", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Cancel closes the dialog without saving changes", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("First Name").fill("Discarded")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByText("Discarded Target")).not.toBeVisible()
    await expect(page.getByText("Edit Target").first()).toBeVisible()
  })

  test("shows validation error when first name is cleared and saved", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("First Name").fill("")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("First name is required.")).toBeVisible()
  })

  test("updated patient name persists after navigating away and back", async ({ page }) => {
    await createPatient(page)
    await page.getByText("Edit Target").click()
    const patientUrl = page.url()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("First Name").fill("Persistent")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Persistent Target").first()).toBeVisible()

    await page.goto("/")
    await page.goto(patientUrl)
    await expect(page.getByText("Persistent Target").first()).toBeVisible()
  })
})
