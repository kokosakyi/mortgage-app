# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm test             # Run unit tests (vitest run)
pnpm test:watch       # Run unit tests in watch mode
pnpm test:e2e         # Run Playwright e2e tests (auto-starts dev server)
pnpm test:e2e:ui      # Run e2e tests with interactive UI

pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes directly to DB
```

Run a single unit test file:
```bash
pnpm vitest run __tests__/mortgage-calculator.test.ts
```

**First-time e2e setup:** `pnpm exec playwright install chromium` (browser binary not installed by default).

**Before running e2e:** Check port 3000 isn't held by a stale process:
```powershell
netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
Stop-Process -Id <PID> -Force   # if one is found
```

## Architecture

### Tech Stack
- **Next.js 15** (App Router) with React 18, TypeScript strict mode
- **Tailwind CSS + shadcn/ui** (Radix UI primitives) for styling; Wealthsimple-inspired teal theme (`--primary: 170 100% 39%`)
- **Recharts** for the amortization balance-over-time line chart
- **Drizzle ORM + PostgreSQL** (via `@vercel/postgres`) — schema in [db/schema.ts](db/schema.ts)
- **Vitest** (jsdom environment) for unit tests; **Playwright** for e2e tests

### Key Architectural Decisions

**localStorage-first:** Fully functional without a database. [lib/mortgage-storage.ts](lib/mortgage-storage.ts) persists one `SavedMortgage` per browser. `SavedMortgage` extends `MortgageResult` with `inputs: MortgageInput`, `lumpSums: LumpSum[]`, and `scheduleStartDate: string`. DB schema supports multi-user with optional `userId`, but auth is not wired up — [e2e/auth.spec.ts](e2e/auth.spec.ts) tests the no-auth flow.

**Canadian mortgage math** — all pure functions in [lib/mortgage-calculator.ts](lib/mortgage-calculator.ts):
- Semi-annual compounding: `effectiveAnnualRate = (1 + r/2)^2 - 1`
- Monthly period rate: `(1 + effectiveAnnualRate)^(1/12) - 1`
- Biweekly period rate: `(1 + effectiveAnnualRate)^(1/26) - 1` — computed directly via `calculateBiweeklyInterestRate`, **never** as `monthlyPayment / 2`
- Accelerated-biweekly payment: intentionally `monthlyPayment / 2` paid 26×/year ≈ 13 monthly equivalents
- CMHC insurance tiers: 4% (<10% down), 3.1% (10–14.99%), 2.8% (15–19.99%), 0% (≥20%)
- `MortgageInput.downPayment` and `downPaymentPercent` are mutually exclusive nulls — only one is non-null at a time

**Amortization schedule** — [lib/amortization-schedule.ts](lib/amortization-schedule.ts):
- `generateAmortizationSchedule(mortgage, lumpSums, startDate?)` — payment-by-payment loop applying lump sums from a `Map<paymentNumber, amount>`, stops at `balance ≤ 0.005`
- `generateComparisonSchedules()` always generates `baseline` with no lump sums and `accelerated` with them; `interestSaved` / `periodsSaved` are only meaningful on the `accelerated` schedule (baseline always has zeros)

**Paydown planner** — [lib/paydown-planner.ts](lib/paydown-planner.ts):
- Binary search (~40 iterations, converges to $1) back-solves for the annual lump sum or per-period payment increase needed to hit a target year or interest savings
- `PaydownPlanner` component is **button-triggered** (not live) because each binary search takes ~40ms

### Data Flow

```
User inputs → CalculatorForm (useEffect) → calculateMortgage() → MortgageResult
MortgageResult + LumpSum[] → useMemo → generateComparisonSchedules() → scheduleData

Tabs:
  Calculator     → InputPanel + ResultsPanel (Save → localStorage → /dashboard)
  Amortization   → LumpSumManager + AmortizationChart + AmortizationTable
  Paydown Planner → PaydownPlanner (button-triggered)
```

`CalculatorForm` ([components/calculator-form.tsx](components/calculator-form.tsx)) is a thin orchestrator (~135 lines). All display components are stateless except `PaydownPlanner` (goal/suggestion state) and `InputPanel` (down payment mode toggle).

### Theme

CSS custom properties in [app/globals.css](app/globals.css). Key values:
- `--primary: 170 100% 39%` — teal accent (≈ #00c8a0)
- `--chart-1`: teal (accelerated line), `--chart-2`: blue (original line), `--chart-4`: red (interest)
- `.result-number` — apply to all displayed currency amounts; gives `tabular-nums` + smooth transition
- Cards use `shadow-card` (no border) — defined in [tailwind.config.ts](tailwind.config.ts); `components/ui/card.tsx` was intentionally changed from the shadcn default (`border shadow-sm`) to `shadow-card`

## Gotchas

**shadcn CLI is broken for this project.** `npx shadcn@latest add` fails with `colors/green.json was not found`. All `components/ui/` files must be written manually following the existing pattern (Radix primitive + `cn()` + `forwardRef`). See [.claude/skills/add-ui-component.md](.claude/skills/add-ui-component.md).

**Vitest excludes e2e/.** `vitest.config.ts` has `exclude: ["e2e/**", "node_modules/**"]`. Without this, Playwright spec files are picked up by Vitest and fail. Do not remove it.

**InputPanel label accessibility.** In [components/input-panel.tsx](components/input-panel.tsx), only the `homePrice` input has `htmlFor="homePrice"` (and thus a proper label association). Down payment, interest rate, and amortization use `<Label>` without `htmlFor` and **cannot** be found by Playwright's `getByLabel()`. Use `getByRole` / `getByText` selectors instead. See [.claude/skills/e2e-testing.md](.claude/skills/e2e-testing.md).

**Recharts Tooltip formatter types.** The formatter callback receives `ValueType` (`string | number | (string|number)[]`). Guard with `typeof value === "number" ? fmt(value) : value` before calling number formatters.

**Dashboard page heading.** The dashboard `<h1>` is `"Saved mortgage"`. The word "Dashboard" appears only in a `<p>` eyebrow tag (not a heading role). E2e selectors must use `/saved mortgage/i`.

**Environment Variables**
- `DATABASE_URL` — required for DB operations; [lib/db.ts](lib/db.ts) throws at import time if missing
