import { test, expect } from "@playwright/test";

test("chat triage flow shows disclaimer", async ({ page }) => {
  await page.goto("/chat");
  await page.getByLabel(/describe your symptoms/i).fill("I have a mild headache");
  await page.getByRole("button", { name: /send/i }).click();

  await expect(
    page.getByText(/this is not a substitute for professional medical advice/i),
  ).toBeVisible({ timeout: 20_000 });
});

