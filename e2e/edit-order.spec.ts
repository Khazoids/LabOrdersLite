import { test, expect } from "./fixtures/db-fixture"

async function createPatientAndOrder(page: Parameters<Parameters<typeof test>[1]>[0]["page"]) {
  // Create a patient first
  await page.goto("/patients/new")
  await page.getByLabel("First Name").fill("Order")
  await page.getByLabel("Last Name").fill("Owner")
  await page.getByLabel("Date of Birth").fill("1980-03-20")
  await page.getByLabel("Email").fill("order.owner@example.com")
  await page.getByLabel("Phone").fill("555-5678")
  await page.getByLabel("Street Address").fill("200 Test Blvd")
  await page.getByLabel("City").fill("Chicago")
  await page.getByLabel("State").fill("IL")
  await page.getByLabel("Zip Code").fill("60601")
  await page.getByRole("button", { name: "Create Patient" }).click()
  await expect(page).toHaveURL("/")

  // Create an order for the patient
  await page.goto("/orders/new")
  await page.getByLabel("Order Name").fill("Original Order Name")

  // Select the patient
  await page.getByRole("combobox").click()
  await page.getByText("Order Owner").click()

  // Select the first available lab test
  await page.locator(".rounded-lg.border button").first().click()

  await page.getByRole("button", { name: "Create Order" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("Edit order", () => {
  test("Edit button is visible on the order detail page", async ({ page }) => {
    await createPatientAndOrder(page)

    // Navigate to the order via the patient's page
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await expect(page.getByRole("button", { name: /edit/i })).toBeVisible()
  })

  test("clicking Edit opens a dialog with the current order name pre-filled", async ({ page }) => {
    await createPatientAndOrder(page)
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await page.getByRole("button", { name: /edit/i }).click()

    await expect(page.getByLabel("Order Name")).toHaveValue("Original Order Name")
  })

  test("saving changes updates the order name on the page", async ({ page }) => {
    await createPatientAndOrder(page)
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await page.getByRole("button", { name: /edit/i }).click()
    await page.getByLabel("Order Name").fill("Renamed Order")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("Renamed Order")).toBeVisible()
  })

  test("dialog closes after a successful save", async ({ page }) => {
    await createPatientAndOrder(page)
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await page.getByRole("button", { name: /edit/i }).click()
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByText("Edit Order")).not.toBeVisible()
  })

  test("Cancel closes the dialog without saving", async ({ page }) => {
    await createPatientAndOrder(page)
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await page.getByRole("button", { name: /edit/i }).click()
    await page.getByLabel("Order Name").fill("Discarded Name")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByText("Original Order Name")).toBeVisible()
    await expect(page.getByText("Discarded Name")).not.toBeVisible()
  })

  test("updated name appears in the breadcrumb after saving", async ({ page }) => {
    await createPatientAndOrder(page)
    await page.getByText("Order Owner").click()
    await page.getByText("Original Order Name").click()

    await page.getByRole("button", { name: /edit/i }).click()
    await page.getByLabel("Order Name").fill("Breadcrumb Test")
    await page.getByRole("button", { name: "Save Changes" }).click()

    // Breadcrumb should update
    await expect(page.getByText("Breadcrumb Test")).toBeVisible()
  })
})
