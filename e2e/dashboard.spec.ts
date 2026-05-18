import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should be accessible without authentication", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /saved mortgage/i })).toBeVisible();
  });

  test("should show message when no mortgage is saved", async ({ page }) => {
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByText(/no mortgage saved/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to calculator/i })).toBeVisible();
  });

  test("should save and display mortgage from calculator", async ({ page }) => {
    await page.goto("/");

    // Default values auto-calculate; wait for payment hero
    await expect(page.getByText(/Your payment/i)).toBeVisible({ timeout: 3000 });

    // Save mortgage
    await page.getByRole("button", { name: /save mortgage/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show saved mortgage overview
    await expect(page.getByText(/Overview/i)).toBeVisible();
    await expect(page.getByText("Payment", { exact: true })).toBeVisible();
  });
});
