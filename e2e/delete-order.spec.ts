import { test, expect } from "./fixtures/db-fixture"

test.describe("Delete order", () => {
  test("clicking the delete icon opens a confirmation dialog", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await page.getByTestId("delete-order-trigger").first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Delete order?")).toBeVisible()
  })

  test("confirmation dialog warns that the action cannot be undone", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await page.getByTestId("delete-order-trigger").first().click()
    await expect(page.getByText("This action cannot be undone.")).toBeVisible()
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
    await expect(page.getByText("No orders yet.")).toBeVisible()
  })

  test("deleted order is absent after a page reload", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()
    const patientUrl = page.url()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Delete" }).click()

    await page.goto(patientUrl)
    await expect(page.getByText("Annual Checkup")).not.toBeVisible()
  })

  test("deleted order is absent from the all-orders page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("row", { name: /john smith/i }).click()

    await page.getByTestId("delete-order-trigger").first().click()
    await page.getByRole("button", { name: "Delete" }).click()

    await page.goto("/orders")
    await expect(page.getByText("Annual Checkup")).not.toBeVisible()
  })

  test("full flow: create order → verify → delete → verify removed", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("Full Flow Order")
    await page.getByLabel("Patient").click()
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
