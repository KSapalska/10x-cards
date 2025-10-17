import { test, expect } from "@playwright/test";

test.describe("Landing redirect flow", () => {
  test("anonymous user is redirected to /auth/login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /Zaloguj się/i })).toBeVisible();
  });
});


