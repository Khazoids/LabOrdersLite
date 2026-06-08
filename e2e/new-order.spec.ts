import { test, expect } from "./fixtures/db-fixture"

test.describe("Create new order", () => {
  test("submit button is disabled until all required fields are filled", async ({ page }) => {
    await page.goto("/orders/new")
    const submit = page.getByRole("button", { name: "Create Order" })
    await expect(submit).toBeDisabled()

    await page.getByPlaceholder("e.g. Annual Checkup").fill("My Order")
    await expect(submit).toBeDisabled()
  })

  test("selecting a lab test shows it in the order summary with the correct price", async ({ page }) => {
    await page.goto("/orders/new")
    await expect(page.getByText("Order Summary")).not.toBeVisible()

    await page.getByRole("button", { name: /complete blood count/i }).click()
    await expect(page.getByText("Order Summary")).toBeVisible()
    // CBC and $45.00 also appear in the test list — use first() to avoid strict-mode violations
    await expect(page.getByText("CBC").first()).toBeVisible()
    await expect(page.getByText("$45.00").first()).toBeVisible()
  })

  test("deselecting a test removes it from the order summary", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await expect(page.getByText("Order Summary")).not.toBeVisible()
  })

  test("submitting a valid form creates the order and redirects to the home page", async ({ page }) => {
    await page.goto("/orders/new")

    await page.getByPlaceholder("e.g. Annual Checkup").fill("E2E Test Order")

    const patientTrigger = page.getByText("Select a patient…")
    await patientTrigger.click()
    await page.getByRole("option", { name: "John Smith" }).click()

    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()

    await expect(page).toHaveURL("/")
    // Orders are shown on the patient detail page, not the home page
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.getByText("E2E Test Order")).toBeVisible()
  })

  test("Cancel button returns to the home page without creating an order", async ({ page }) => {
    await page.goto("/orders/new")
    // Base UI Button with render={<Link>} renders as <a role="button">
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page).toHaveURL("/")
  })
})
