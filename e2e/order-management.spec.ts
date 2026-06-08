import { test, expect } from "./fixtures/db-fixture"

test.describe("Order management", () => {
  test("clicking the delete icon opens a confirmation dialog", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    const deleteBtn = page.getByTestId("delete-order-trigger").first()
    await deleteBtn.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Delete order?")).toBeVisible()
  })

  test("clicking Cancel closes the dialog without deleting the order", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page.getByText("Annual Checkup")).toBeVisible()
  })

  test("confirming deletion removes the order from the list", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Annual Checkup")).not.toBeVisible()
  })

  test("deleted order is still absent after a page refresh", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    const url = page.url()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Delete" }).click()
    await page.goto(url)

    await expect(page.getByText("Annual Checkup")).not.toBeVisible()
  })

  test("full flow: create order → verify in list → delete → verify removed", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByPlaceholder("e.g. Annual Checkup").fill("Full Flow Order")

    const patientTrigger = page.getByText("Select a patient…")
    await patientTrigger.click()
    await page.getByRole("option", { name: "Sarah Johnson" }).click()
    await page.getByRole("button", { name: /complete blood count/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()

    await expect(page).toHaveURL("/")

    await page.getByRole("row", { name: /sarah johnson/i }).click()
    await expect(page.getByText("Full Flow Order")).toBeVisible()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Full Flow Order")).not.toBeVisible()
  })
})
