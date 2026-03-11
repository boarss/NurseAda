import { test, expect } from "@playwright/test";

test("medications page shows tabs and disclaimer", async ({ page }) => {
  await page.goto("/medications");

  await expect(page.getByRole("tab", { name: /my reminders/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /interaction checker/i })).toBeVisible();
  await expect(page.getByText(/this is general information/i)).toBeVisible({
    timeout: 10_000,
  });
});

