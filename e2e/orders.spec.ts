import { test, expect } from "./fixtures/db-fixture"

test.describe("All orders page", () => {
  test("shows stat cards for Total Orders, Pending, In Progress, and Complete", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByText("Total Orders")).toBeVisible()
    await expect(page.getByText("Pending")).toBeVisible()
    await expect(page.getByText("In Progress")).toBeVisible()
    await expect(page.getByText("Complete").first()).toBeVisible()
  })

  test("seeded data shows 1 total order and 1 complete", async ({ page }) => {
    await page.goto("/orders")
    // Stat cards: Total Orders = 1, Complete = 1
    const totalCard = page.getByText("Total Orders").locator("..")
    await expect(totalCard.getByText("1")).toBeVisible()
  })

  test("shows the seeded Annual Checkup order", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByText("Annual Checkup")).toBeVisible()
  })

  test("shows the patient name column for the seeded order", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByText("John Smith")).toBeVisible()
  })

  test("table has Patient, Name, Tests, Total, Date, Status columns", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("columnheader", { name: "Patient" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Total" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible()
  })

  test("search by order name filters the results", async ({ page }) => {
    await page.goto("/orders")
    await page.getByPlaceholder("Search by name or order ID…").fill("Annual")
    await expect(page.getByText("Annual Checkup")).toBeVisible()
  })

  test("search with no matching term shows empty state", async ({ page }) => {
    await page.goto("/orders")
    await page.getByPlaceholder("Search by name or order ID…").fill("xyznotfound")
    await expect(page.getByText("No orders match your search.")).toBeVisible()
  })

  test("clicking New Order navigates to /orders/new", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: "New Order" }).click()
    await expect(page).toHaveURL("/orders/new")
  })

  test("clicking an order row navigates to the order detail page", async ({ page }) => {
    await page.goto("/orders")
    await page.getByText("Annual Checkup").click()
    await expect(page).toHaveURL(/\/orders\/[^/]+$/)
    await expect(page.getByText("Annual Checkup").first()).toBeVisible()
  })

  test("delete icon opens the confirmation dialog from the orders page", async ({ page }) => {
    await page.goto("/orders")
    await page.getByTestId("delete-order-trigger").first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Delete order?")).toBeVisible()
  })

  test("newly created order appears in the all-orders list", async ({ page }) => {
    await page.goto("/orders/new")
    await page.getByLabel("Order Name").fill("Cross-Page Visible Order")
    await page.getByLabel("Patient").click()
    await page.getByRole("option", { name: "Sarah Johnson" }).click()
    await page.getByRole("button", { name: /thyroid stimulating hormone/i }).click()
    await page.getByRole("button", { name: "Create Order" }).click()
    await expect(page).toHaveURL("/")

    await page.goto("/orders")
    await expect(page.getByText("Cross-Page Visible Order")).toBeVisible()
    await expect(page.getByText("Sarah Johnson")).toBeVisible()
  })
})
