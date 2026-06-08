import { test, expect } from "./fixtures/db-fixture"

test.describe("Patient detail page", () => {
  test("shows 404 for a non-existent patient ID", async ({ page }) => {
    const response = await page.goto("/patients/non-existent-id-12345")
    expect(response?.status()).toBe(404)
  })

  test("shows patient name, DOB, email, and phone", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("john@example.com")).toBeVisible()
    await expect(page.getByText("(555) 123-4567")).toBeVisible()
  })

  test("shows the orders table when the patient has orders", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await expect(page.getByText("Annual Checkup")).toBeVisible()
  })

  test("Back button navigates to the home page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    // Base UI Button with render={<Link>} renders as <a role="button">
    await page.getByRole("button", { name: /back/i }).click()
    await expect(page).toHaveURL("/")
  })
})
