import { test, expect } from "./fixtures/db-fixture"

test.describe("Patient detail page", () => {
  test("shows 404 for a non-existent patient ID", async ({ page }) => {
    const response = await page.goto("/patients/non-existent-id-12345")
    expect(response?.status()).toBe(404)
  })

  test("shows the patient's name, email, and phone", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("john@example.com")).toBeVisible()
    await expect(page.getByText("(555) 123-4567")).toBeVisible()
  })

  test("shows the patient's date of birth", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /sarah johnson/i }).click()
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
    await expect(page.getByText("sarah@example.com")).toBeVisible()
  })

  test("breadcrumb contains Patients link and patient name", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i })
    await expect(breadcrumb.getByRole("link", { name: "Patients" })).toBeVisible()
    await expect(breadcrumb.getByText("John Smith")).toBeVisible()
  })

  test("Patients breadcrumb link navigates home", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await page.getByRole("navigation", { name: /breadcrumb/i }).getByRole("link", { name: "Patients" }).click()
    await expect(page).toHaveURL("/")
  })

  test("shows the orders table with an Orders heading", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.getByText("Orders").first()).toBeVisible()
  })

  test("John Smith's orders table shows Annual Checkup", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.getByText("Annual Checkup")).toBeVisible()
  })

  test("patient with no orders shows 'No orders yet.'", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /sarah johnson/i }).click()
    await expect(page.getByText("No orders yet.")).toBeVisible()
  })

  test("Back button navigates to the home page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await page.getByRole("button", { name: /back/i }).click()
    await expect(page).toHaveURL("/")
  })

  test("New Order button navigates to /orders/new", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await page.getByRole("button", { name: "New Order" }).click()
    await expect(page).toHaveURL("/orders/new")
  })
})
