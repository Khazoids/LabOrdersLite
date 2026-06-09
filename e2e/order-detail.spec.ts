import { test, expect } from "./fixtures/db-fixture"
import type { Page } from "@playwright/test"

async function goToAnnualCheckup(page: Page) {
  await page.goto("/")
  await page.getByRole("row", { name: /john smith/i }).click()
  await page.getByText("Annual Checkup").click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
}

test.describe("Order detail page", () => {
  test("shows 404 for a non-existent order ID", async ({ page }) => {
    const response = await page.goto("/orders/non-existent-id-99999")
    expect(response?.status()).toBe(404)
  })

  test("shows the order name, patient, and total", async ({ page }) => {
    await goToAnnualCheckup(page)
    // Use first() because the name also appears in the breadcrumb
    await expect(page.getByText("Annual Checkup").first()).toBeVisible()
    await expect(page.getByText("$110.00")).toBeVisible()
  })

  test("shows a link to the patient's detail page", async ({ page }) => {
    await goToAnnualCheckup(page)
    // Two John Smith links exist (breadcrumb + details section) — either is fine
    await expect(page.getByRole("link", { name: "John Smith" }).first()).toBeVisible()
  })

  test("patient link in the details section navigates to patient detail", async ({ page }) => {
    await goToAnnualCheckup(page)
    // Click the details-section link (inside the <dl>), not the breadcrumb one
    await page.locator("dl").getByRole("link", { name: "John Smith" }).click()
    await expect(page).toHaveURL(/\/patients\//)
    await expect(page.getByText("John Smith").first()).toBeVisible()
  })

  test("breadcrumb shows Patients / John Smith / Annual Checkup", async ({ page }) => {
    await goToAnnualCheckup(page)
    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i })
    await expect(breadcrumb.getByRole("link", { name: "Patients" })).toBeVisible()
    await expect(breadcrumb.getByRole("link", { name: "John Smith" })).toBeVisible()
    await expect(breadcrumb.getByText("Annual Checkup")).toBeVisible()
  })

  test("breadcrumb patient link navigates to patient detail", async ({ page }) => {
    await goToAnnualCheckup(page)
    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i })
    await breadcrumb.getByRole("link", { name: "John Smith" }).click()
    await expect(page).toHaveURL(/\/patients\//)
  })

  test("complete order shows 'Test Results' card title", async ({ page }) => {
    await goToAnnualCheckup(page)
    await expect(page.getByText("Test Results")).toBeVisible()
  })

  test("complete order shows Result column in the tests table", async ({ page }) => {
    await goToAnnualCheckup(page)
    await expect(page.getByRole("columnheader", { name: "Result" })).toBeVisible()
  })

  test("complete order shows Positive/Negative results for each test", async ({ page }) => {
    await goToAnnualCheckup(page)
    const resultCells = page.getByRole("cell").filter({ hasText: /^(Positive|Negative)$/ })
    await expect(resultCells.first()).toBeVisible()
  })

  test("non-complete order shows 'Ordered Tests' title and no Result column", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("Pending Panel")
    await page.getByLabel("Patient").click()
    await page.getByRole("option", { name: "Sarah Johnson" }).click()
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()
    await expect(page).toHaveURL("/")

    await page.getByRole("row", { name: /sarah johnson/i }).click()
    await page.getByText("Pending Panel").click()

    await expect(page.getByText("Ordered Tests")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Result" })).not.toBeVisible()
  })

  test("changing status from Complete to Pending switches to 'Ordered Tests'", async ({ page }) => {
    await goToAnnualCheckup(page)
    await expect(page.getByText("Test Results")).toBeVisible()

    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "Pending" }).click()

    await expect(page.getByText("Ordered Tests")).toBeVisible()
    await expect(page.getByText("Test Results")).not.toBeVisible()
  })

  test("changing status to In Progress removes the Result column", async ({ page }) => {
    await goToAnnualCheckup(page)
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "In Progress" }).click()

    await expect(page.getByRole("columnheader", { name: "Result" })).not.toBeVisible()
  })

  test("status change persists after page reload", async ({ page }) => {
    await goToAnnualCheckup(page)
    const url = page.url()

    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "Pending" }).click()
    await expect(page.getByText("Ordered Tests")).toBeVisible()

    await page.goto(url)
    await expect(page.getByText("Ordered Tests")).toBeVisible()
  })

  test("Back button navigates to the patient detail page", async ({ page }) => {
    await goToAnnualCheckup(page)
    await page.getByRole("button", { name: /back/i }).click()
    await expect(page).toHaveURL(/\/patients\//)
    await expect(page.getByText("John Smith").first()).toBeVisible()
  })

  test("shows Test, Code, Turnaround, and Price columns", async ({ page }) => {
    await goToAnnualCheckup(page)
    await expect(page.getByRole("columnheader", { name: "Test" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Code" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Turnaround" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Price" })).toBeVisible()
  })

  test("ordered test names are shown in the table", async ({ page }) => {
    await goToAnnualCheckup(page)
    await expect(page.getByText("Complete Blood Count")).toBeVisible()
    await expect(page.getByText("Comprehensive Metabolic Panel")).toBeVisible()
  })
})
