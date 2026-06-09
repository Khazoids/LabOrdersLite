import { test, expect } from "./fixtures/db-fixture"

test.describe("Create new order", () => {
  test("Create Order button is disabled until all required fields are filled", async ({ page }) => {
    await page.goto("/orders/new")
    const submit = page.getByRole("button", { name: "Create Order" })
    await expect(submit).toBeDisabled()

    await page.getByLabel("Order Name").fill("My Order")
    await expect(submit).toBeDisabled()
  })

  test("button remains disabled with name and patient but no test selected", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("My Order")
    await page.getByLabel("Patient").click()
    await page.getByRole("option", { name: "John Smith" }).click()
    await expect(page.getByRole("button", { name: "Create Order" })).toBeDisabled()
  })

  test("selecting a lab test shows Order Summary with correct price", async ({ page }) => {
    await page.goto("/orders/new")
    await expect(page.getByText("Order Summary")).not.toBeVisible()

    await page.getByRole("button", { name: /complete blood count/i }).click()
    await expect(page.getByText("Order Summary")).toBeVisible()
    await expect(page.getByText("CBC").first()).toBeVisible()
    await expect(page.getByText("$45.00").first()).toBeVisible()
  })

  test("selecting multiple tests shows combined total in the summary", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: /comprehensive metabolic panel/i }).click()
    // CBC ($45) + CMP ($65) = $110
    await expect(page.getByText("$110.00").first()).toBeVisible()
  })

  test("deselecting a test removes it from the Order Summary", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await expect(page.getByText("Order Summary")).not.toBeVisible()
  })

  test("submitting a valid form creates the order and redirects to home", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("E2E Test Order")
    await page.getByLabel("Patient").click()
    await page.getByRole("option", { name: "John Smith" }).click()
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()

    await expect(page).toHaveURL("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await expect(page.getByText("E2E Test Order")).toBeVisible()
  })

  test("new order can be created for Sarah Johnson", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("Sarah's Panel")
    await page.getByLabel("Patient").click()
    await page.getByRole("option", { name: "Sarah Johnson" }).click()
    await page.getByRole("button", { name: /thyroid stimulating hormone/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()

    await expect(page).toHaveURL("/")
    await page.getByRole("row", { name: /sarah johnson/i }).click()
    await expect(page.getByText("Sarah's Panel")).toBeVisible()
  })

  test("Back button navigates back in browser history", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    await page.getByRole("button", { name: "New Order" }).click()
    await expect(page).toHaveURL("/orders/new")
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page).toHaveURL(/\/patients\//)
  })

  test("all three seeded lab tests are listed", async ({ page }) => {
    await page.goto("/orders/new")
    await expect(page.getByRole("button", { name: /complete blood count/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /comprehensive metabolic panel/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /thyroid stimulating hormone/i })).toBeVisible()
  })

  test("both seeded patients appear in the patient dropdown", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Patient").click()
    await expect(page.getByRole("option", { name: "John Smith" })).toBeVisible()
    await expect(page.getByRole("option", { name: "Sarah Johnson" })).toBeVisible()
  })
})
