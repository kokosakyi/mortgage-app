import { test, expect } from "@playwright/test";

test.describe("Authentication - Removed", () => {
  test("dashboard should be accessible without authentication", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /saved mortgage/i })).toBeVisible();
  });

  test("should be able to save mortgage without authentication", async ({ page }) => {
    await page.goto("/");
    // Default values auto-calculate on load
    await expect(page.getByText(/Your payment/i)).toBeVisible({ timeout: 3000 });
    // Save button should be visible (no auth required)
    await expect(page.getByRole("button", { name: /save mortgage/i })).toBeVisible();
  });
});
