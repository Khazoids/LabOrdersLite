import { test, expect } from "./fixtures/db-fixture"

test.describe("App header navigation", () => {
  test("shows 'Lab Orders Lite' branding on the home page", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Lab Orders Lite")).toBeVisible()
  })

  test("Orders nav link navigates to /orders", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Orders", exact: true }).click()
    await expect(page).toHaveURL("/orders")
  })

  test("Patients nav link navigates to /", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("link", { name: "Patients" }).click()
    await expect(page).toHaveURL("/")
  })

  test("header is present on patient detail page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.locator("header")).toBeVisible()
    await expect(page.getByText("Lab Orders Lite")).toBeVisible()
  })

  test("header is present on order detail page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await page.getByText("Annual Checkup").click()
    await expect(page.locator("header")).toBeVisible()
    await expect(page.getByText("Lab Orders Lite")).toBeVisible()
  })

  test("clicking the brand logo navigates to /", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("link", { name: "Lab Orders Lite" }).click()
    await expect(page).toHaveURL("/")
  })
})
