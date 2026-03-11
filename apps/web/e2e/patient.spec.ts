import { test, expect } from "@playwright/test";

test("patient profile tabs render when authenticated (happy-path placeholder)", async ({ page }) => {
  // Assumes an authenticated session and test patient id are available in the environment.
  await page.goto("/patient/test-id");

  await expect(page.getByText(/patient profile/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /observations/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /medications/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /reports/i })).toBeVisible();
});

