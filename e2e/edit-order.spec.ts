import { test, expect } from "./fixtures/db-fixture"
import type { Page } from "@playwright/test"

async function createOrderForSarah(page: Page, orderName: string) {
  await page.goto("/orders/new")
  await page.getByLabel("Order Name").fill(orderName)
  await page.getByLabel("Patient").click()
  await page.getByRole("option", { name: "Sarah Johnson" }).click()
  await page.getByRole("button", { name: /complete blood count/i }).click()
  await page.getByRole("button", { name: "Create Order" }).click()
  await expect(page).toHaveURL("/")
}

async function goToOrderDetail(page: Page, patientName: string, orderName: string) {
  await page.getByRole("row", { name: new RegExp(patientName, "i") }).click()
  await page.getByText(orderName).click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
}

test.describe("Edit order", () => {
  test("Edit button is visible on the order detail page", async ({ page }) => {
    await createOrderForSarah(page, "Original Order Name")
    await goToOrderDetail(page, "sarah johnson", "Original Order Name")
    await expect(page.getByRole("button", { name: /edit/i })).toBeVisible()
  })

  test("clicking Edit opens a dialog with the current order name pre-filled", async ({ page }) => {
    await createOrderForSarah(page, "Pre-filled Order")
    await goToOrderDetail(page, "sarah johnson", "Pre-filled Order")
    await page.getByRole("button", { name: /edit/i }).click()

    await expect(page.getByLabel("Order Name")).toHaveValue("Pre-filled Order")
  })

  test("saving changes updates the order name on the page", async ({ page }) => {
    await createOrderForSarah(page, "Original Order Name")
    await goToOrderDetail(page, "sarah johnson", "Original Order Name")
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("Order Name").fill("Renamed Order")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("Renamed Order").first()).toBeVisible()
    await expect(page.getByText("Original Order Name")).not.toBeVisible()
  })

  test("dialog closes after a successful save", async ({ page }) => {
    await createOrderForSarah(page, "Dialog Close Test")
    await goToOrderDetail(page, "sarah johnson", "Dialog Close Test")
    await page.getByRole("button", { name: /edit/i }).click()
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Cancel closes the dialog without saving", async ({ page }) => {
    await createOrderForSarah(page, "Cancel Test Order")
    await goToOrderDetail(page, "sarah johnson", "Cancel Test Order")
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("Order Name").fill("Discarded Name")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByText("Cancel Test Order").first()).toBeVisible()
    await expect(page.getByText("Discarded Name")).not.toBeVisible()
  })

  test("renamed order appears in the breadcrumb after saving", async ({ page }) => {
    await createOrderForSarah(page, "Breadcrumb Original")
    await goToOrderDetail(page, "sarah johnson", "Breadcrumb Original")
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("Order Name").fill("Breadcrumb Updated")
    await page.getByRole("button", { name: "Save Changes" }).click()

    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i })
    await expect(breadcrumb.getByText("Breadcrumb Updated")).toBeVisible()
  })

  test("rename persists after navigating away and back", async ({ page }) => {
    await createOrderForSarah(page, "Persist Test Order")
    await goToOrderDetail(page, "sarah johnson", "Persist Test Order")
    const orderUrl = page.url()
    await page.getByRole("button", { name: /edit/i }).click()

    await page.getByLabel("Order Name").fill("Persisted Name")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Persisted Name").first()).toBeVisible()

    await page.goto("/")
    await page.goto(orderUrl)
    await expect(page.getByText("Persisted Name").first()).toBeVisible()
  })
})
