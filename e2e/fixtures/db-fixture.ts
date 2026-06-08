import { test as base, expect } from "@playwright/test"

export const test = base.extend({
  page: async ({ page }, use) => {
    const response = await page.request.get("http://localhost:3001/api/test/reset")
    if (!response.ok()) {
      throw new Error(`DB reset failed with status ${response.status()}`)
    }
    await use(page)
  },
})

export { expect }
