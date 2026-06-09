import { test, expect } from "./fixtures/db-fixture"

test.describe("Patient list", () => {
  test("home page displays patient table with correct column headers", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Date of Birth" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Phone" })).toBeVisible()
  })

  test("both seeded patients are listed", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
  })

  test("search input filters by last name", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Search patients...").fill("Smith")
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).not.toBeVisible()
  })

  test("search input filters by first name", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Search patients...").fill("Sarah")
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
    await expect(page.getByText("John Smith")).not.toBeVisible()
  })

  test("unmatched search shows 'No patients match your search.'", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Search patients...").fill("xxxxxx-nobody")
    await expect(page.getByText("No patients match your search.")).toBeVisible()
  })

  test("clearing the search restores the full patient list", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Search patients...").fill("Smith")
    await expect(page.getByText("Sarah Johnson")).not.toBeVisible()
    await page.getByPlaceholder("Search patients...").fill("")
    await expect(page.getByText("John Smith")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
  })

  test("clicking a patient row navigates to their detail page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page).toHaveURL(/\/patients\//)
    await expect(page.getByText("John Smith").first()).toBeVisible()
  })

  test("Add Patient button navigates to /patients/new", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Add Patient" }).click()
    await expect(page).toHaveURL("/patients/new")
  })

  test("dashboard shows Open Orders stat", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Open Orders")).toBeVisible()
  })

  test("dashboard shows Total Orders stat", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Total Orders")).toBeVisible()
  })
})
