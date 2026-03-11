import { test, expect } from "@playwright/test";

test("remedies page loads catalog and disclaimer", async ({ page }) => {
  await page.goto("/remedies");

  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByText(/herbal remedies/i)).toBeVisible();
  await expect(page.getByText(/these are complementary options/i)).toBeVisible({
    timeout: 10_000,
  });
});

