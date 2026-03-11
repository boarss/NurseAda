import { test, expect } from "@playwright/test";

test("appointments page switches tabs", async ({ page }) => {
  await page.goto("/appointments");

  await expect(page.getByRole("tab", { name: /my appointments/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /find a clinic/i })).toBeVisible();

  await page.getByRole("tab", { name: /find a clinic/i }).click();
  await expect(page.getByText(/all states/i)).toBeVisible();
});

