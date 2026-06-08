import { test, expect } from "./fixtures/db-fixture"

test.describe("Patient list", () => {
  test("home page displays a patient list with the correct columns", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Date of Birth" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Phone" })).toBeVisible()
  })

  test("search input filters the patient list", async ({ page }) => {
    await page.goto("/")
    // "Smith" uniquely matches "John Smith" but not "Sarah Johnson"
    await page.getByPlaceholder("Search patients...").fill("Smith")
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).not.toBeVisible()
  })

  test("shows no-results message for an unmatched search term", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Search patients...").fill("xxxxxx-nobody")
    await expect(page.getByText("No patients match your search.")).toBeVisible()
  })

  test("clicking a patient row navigates to the patient detail page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page).toHaveURL(/\/patients\//)
    await expect(page.getByText("John Smith")).toBeVisible()
  })
})
