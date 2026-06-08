import { test, expect } from "./fixtures/db-fixture"

test.describe("Create new patient", () => {
  test("Add Patient button navigates to the new patient form", async ({ page }) => {
    await page.goto("/")
    // Base UI Button with render={<Link>} renders as <a role="button">
    await page.getByRole("button", { name: "Add Patient" }).click()
    await expect(page).toHaveURL("/patients/new")
  })

  test("Back button returns to the home page without creating a patient", async ({ page }) => {
    await page.goto("/patients/new")
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page).toHaveURL("/")
  })

  test("form renders all required fields", async ({ page }) => {
    await page.goto("/patients/new")
    await expect(page.getByLabel("First Name")).toBeVisible()
    await expect(page.getByLabel("Last Name")).toBeVisible()
    await expect(page.getByLabel("Date of Birth")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Phone")).toBeVisible()
    await expect(page.getByLabel("Street Address")).toBeVisible()
    await expect(page.getByLabel("City")).toBeVisible()
    await expect(page.getByLabel("State")).toBeVisible()
    await expect(page.getByLabel("Zip Code")).toBeVisible()
  })

  test("shows validation errors when the form is submitted empty", async ({ page }) => {
    await page.goto("/patients/new")
    await page.getByRole("button", { name: "Create Patient" }).click()
    await expect(page.getByText("First name is required.")).toBeVisible()
    await expect(page.getByText("Last name is required.")).toBeVisible()
    await expect(page.getByText("Date of birth is required.")).toBeVisible()
    await expect(page.getByText("Email address is invalid.")).toBeVisible()
    await expect(page.getByText("Phone is required.")).toBeVisible()
  })

  test("submitting a valid form creates the patient and shows them on the home page", async ({ page }) => {
    await page.goto("/patients/new")

    await page.getByLabel("First Name").fill("E2E New")
    await page.getByLabel("Last Name").fill("Patient")
    await page.getByLabel("Date of Birth").fill("1990-05-15")
    await page.getByLabel("Email").fill("e2e.patient@test.com")
    await page.getByLabel("Phone").fill("555-7890")
    await page.getByLabel("Street Address").fill("100 Test Ave")
    await page.getByLabel("City").fill("Springfield")
    await page.getByLabel("State").fill("IL")
    await page.getByLabel("Zip Code").fill("62701")

    await page.getByRole("button", { name: "Create Patient" }).click()

    await expect(page).toHaveURL("/")
    await expect(page.getByText("E2E New Patient")).toBeVisible()
  })

  test("newly created patient appears in the patient list and can be searched", async ({ page }) => {
    await page.goto("/patients/new")

    await page.getByLabel("First Name").fill("Unique")
    await page.getByLabel("Last Name").fill("SearchTarget")
    await page.getByLabel("Date of Birth").fill("1975-11-20")
    await page.getByLabel("Email").fill("unique@search.com")
    await page.getByLabel("Phone").fill("555-3333")
    await page.getByLabel("Street Address").fill("42 Discovery Lane")
    await page.getByLabel("City").fill("Chicago")
    await page.getByLabel("State").fill("IL")
    await page.getByLabel("Zip Code").fill("60601")

    await page.getByRole("button", { name: "Create Patient" }).click()
    await expect(page).toHaveURL("/")

    await page.getByPlaceholder("Search patients...").fill("SearchTarget")
    await expect(page.getByText("Unique SearchTarget")).toBeVisible()
  })
})
