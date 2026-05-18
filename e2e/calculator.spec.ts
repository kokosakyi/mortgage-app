import { test, expect } from "@playwright/test";

test.describe("Mortgage Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display calculator form with tabs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Know your numbers/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Calculator/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Amortization/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Paydown Planner/i })).toBeVisible();
    await expect(page.getByLabel("Home price")).toBeVisible();
  });

  test("should calculate mortgage payments and show payment hero", async ({ page }) => {
    // Default values auto-calculate on load
    await expect(page.getByText(/Your payment/i)).toBeVisible({ timeout: 3000 });
    const paymentText = await page.locator('text=/\\$[0-9,]+/').first().textContent();
    expect(paymentText).toBeTruthy();
    expect(paymentText).toMatch(/\$[0-9,]+/);
  });

  test("should show CMHC insurance notice for down payment less than 20%", async ({ page }) => {
    // Switch to $ mode and enter a low down payment
    await page.getByRole("button", { name: "$" }).click();
    await page.getByLabel("Home price").fill("500000");
    // Wait for CMHC notice to appear (default is 20%, so switch to 10%)
    await page.getByRole("button", { name: "%" }).click();
    // The slider default is 20% so adjust it — we use the text input beside the slider
    await page.locator('input[type="number"][max="100"]').last().fill("10");
    await expect(page.getByText(/CMHC insurance required/i)).toBeVisible({ timeout: 3000 });
  });

  test("should show monthly frequency label in payment hero", async ({ page }) => {
    await expect(page.getByText(/per month/i)).toBeVisible({ timeout: 3000 });
  });

  test("should show Amortization tab with table when switched", async ({ page }) => {
    await expect(page.getByText(/Your payment/i)).toBeVisible({ timeout: 3000 });
    await page.getByRole("tab", { name: /Amortization/i }).click();
    await expect(page.getByRole("table")).toBeVisible({ timeout: 3000 });
  });

  test("should show Paydown Planner tab when switched", async ({ page }) => {
    await page.getByRole("tab", { name: /Paydown Planner/i }).click();
    await expect(page.getByText(/Set your paydown goal/i)).toBeVisible({ timeout: 3000 });
  });
});
