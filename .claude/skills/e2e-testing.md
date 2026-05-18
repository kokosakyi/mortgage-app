# Skill: Writing E2E Tests

## Setup

Playwright browsers must be installed before the first run:
```powershell
pnpm exec playwright install chromium
```

`pnpm test:e2e` auto-starts the dev server via `webServer` in `playwright.config.ts`. If port 3000 is occupied by a stale process, the server times out silently. Kill it first:
```powershell
netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
Stop-Process -Id <PID> -Force
```

## Selector reference for this app

| Element | Working selector | Why |
|---|---|---|
| Home price input | `getByLabel("Home price")` | Has `htmlFor="homePrice"` |
| Down payment input | `locator('input[type="number"]')` or context-specific | No `htmlFor` on the Label |
| Interest rate input | `locator('input[type="number"]')` or context-specific | No `htmlFor` |
| Amortization slider | `getByRole("slider")` | Radix Slider has role |
| Payment display | `getByText(/Your payment/i)` | PaymentHero `<p>` label |
| Payment amount | `locator('text=/\\$[0-9,]+/').first()` | Dollar amount in hero |
| Save button | `getByRole("button", { name: /save mortgage/i })` | ResultsPanel button |
| Dashboard heading | `getByRole("heading", { name: /saved mortgage/i })` | `<h1>` on dashboard page |
| "No mortgage saved" | `getByText(/no mortgage saved/i)` | CardTitle when empty |
| Tabs | `getByRole("tab", { name: /Calculator/i })` | Radix Tabs has role |

**The word "Dashboard" is NOT a heading role** — it's an eyebrow `<p>` tag. Use `/saved mortgage/i` for the dashboard `h1`.

## Strict mode: `getByText` with multiple matches

Playwright strict mode throws when a locator matches more than one element. Common pitfall: `getByText("Payment")` matches 4 elements on the dashboard page. Use `{ exact: true }` to target the `<p>Payment</p>` label specifically:
```typescript
await expect(page.getByText("Payment", { exact: true })).toBeVisible();
```

## Default values auto-calculate

The calculator loads with defaults (`$500k home, 20% down, 5.5%, 25yr, monthly`). Tests that just need *a* calculated result don't need to fill any fields:
```typescript
await page.goto("/");
await expect(page.getByText(/Your payment/i)).toBeVisible({ timeout: 3000 });
// result is already there — no form filling needed
```

## Test file locations

- `e2e/calculator.spec.ts` — calculator UI (tabs, hero, CMHC notice)
- `e2e/dashboard.spec.ts` — dashboard page (save flow, empty state)
- `e2e/auth.spec.ts` — no-auth flow verification (despite the name, auth is removed)
