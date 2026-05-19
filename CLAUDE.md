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
- **Recharts** for the amortization chart (balance view + annual payments view)
- **lucide-react** (`^0.446.0`) for icons throughout the UI
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

**Amortization chart** — [components/amortization-chart.tsx](components/amortization-chart.tsx):
- Two views toggled via `ChartView = "balance" | "payments"` state
- **Balance view**: baseline vs. accelerated (with prepayments) balance over time — existing behavior
- **Payments view**: annual interest paid (chart-4/red) vs. annual principal paid (chart-1/teal) per year; shows a dashed `ReferenceLine` at the crossover year where principal ≥ interest; if prepayments exist, a dashed line shows accelerated interest
- `sampleByYear()` returns `{ year, balance, annualInterest, annualPrincipal }` — `annualPrincipal` includes `lumpSum` amounts
- Data is a single merged flat array keyed by `year`; Recharts handles missing keys gracefully via `connectNulls`

**Mortgage start date** — flows from [components/input-panel.tsx](components/input-panel.tsx) up through [components/calculator-form.tsx](components/calculator-form.tsx):
- `startDate: Date` state lives in `CalculatorForm`; passed down as a prop to `InputPanel`, `ResultsPanel`, and `generateComparisonSchedules()`
- Input uses `<input type="month">` (value format `YYYY-MM`) — chosen over a full calendar picker because mortgage start dates are always first-of-month and avoids new packages
- `min="2020-01"` — selectable back to January 2020; do not restrict to current month
- Helper functions `toMonthValue(d)` and `fromMonthValue(v)` in [components/input-panel.tsx](components/input-panel.tsx)
- `ResultsPanel` shows a "First payment" stat row derived from `startDate`

**FieldWithInfo advisor tips** — [components/input-panel.tsx](components/input-panel.tsx):
- `FieldWithInfo` wraps every input field with an expandable advisor-voice tooltip
- **Must be defined at module level** (not inside `InputPanel`) — if defined inside, React treats it as a new component type on every render and resets the open/closed state on every keystroke
- Expand/collapse animation uses the CSS `gridTemplateRows: 0fr → 1fr` trick — smooth without knowing content height
- `TIPS` object at module level holds advisor-voice strings for: `homePrice`, `downPayment`, `interestRate`, `amortization`, `frequency`, `startDate`
- Info button toggles to an X when open; uses `scale-110` + color swap for visual feedback

**Paydown planner** — [lib/paydown-planner.ts](lib/paydown-planner.ts):
- Binary search (~40 iterations, converges to $1) back-solves for the annual lump sum or per-period payment increase needed to hit a target year or interest savings
- `PaydownPlanner` component is **button-triggered** (not live) because each binary search takes ~40ms
- Generates **5 scenarios** via weights `[1, 0.75, 0.5, 0.25, 0]` (lump-sum fraction); index 3 (`w=0.25`, smallest lump + largest payment increase) is tagged "Recommended"
- Each `PaydownScenario` has a `summary: string` — plain-language advisor description of exactly what the homeowner must do
- `buildComparisonScenarios()` uses fixed annual amounts `[0, 2500, 5000, 10000, 15000]`; each scenario includes a `summary`

**Entry animations** — [app/globals.css](app/globals.css):
- `@keyframes fade-in-up` — `opacity: 0, translateY(14px)` → `opacity: 1, translateY(0)`, 500ms spring easing
- `.animate-fade-in-up` utility class — applied to `PaymentHero` outer div
- `[role="tabpanel"][data-state="active"]` — same animation (280ms) on tab panel switches

### Data Flow

```
User inputs → CalculatorForm (useEffect) → calculateMortgage() → MortgageResult
MortgageResult + LumpSum[] + startDate → useMemo → generateComparisonSchedules() → scheduleData

Tabs:
  Calculator     → InputPanel + ResultsPanel (Save → localStorage → /dashboard)
  Amortization   → LumpSumManager + AmortizationChart + AmortizationTable
  Paydown Planner → PaydownPlanner (button-triggered)
```

`CalculatorForm` ([components/calculator-form.tsx](components/calculator-form.tsx)) is a thin orchestrator (~150 lines). Stateful components: `PaydownPlanner` (goal/suggestion state), `InputPanel` (down payment mode toggle), `AmortizationChart` (balance/payments view toggle). `startDate` state lives in `CalculatorForm` and is passed to `InputPanel`, `ResultsPanel`, and `generateComparisonSchedules()`.

### Theme

CSS custom properties in [app/globals.css](app/globals.css). Key values:
- `--primary: 170 100% 39%` — teal accent (≈ #00c8a0)
- `--chart-1`: teal (accelerated/principal line), `--chart-2`: blue (original balance line), `--chart-4`: red (interest lines)
- `.result-number` — apply to all displayed currency amounts; gives `tabular-nums` + smooth transition
- Cards use `shadow-card` (no border) — defined in [tailwind.config.ts](tailwind.config.ts); `components/ui/card.tsx` was intentionally changed from the shadcn default (`border shadow-sm`) to `shadow-card`
- `.animate-fade-in-up` — entry animation for hero card and tab panel transitions

## Gotchas

**shadcn CLI is broken for this project.** `npx shadcn@latest add` fails with `colors/green.json was not found`. All `components/ui/` files must be written manually following the existing pattern (Radix primitive + `cn()` + `forwardRef`). See [.claude/skills/add-ui-component.md](.claude/skills/add-ui-component.md).

**Vitest excludes e2e/.** `vitest.config.ts` has `exclude: ["e2e/**", "node_modules/**"]`. Without this, Playwright spec files are picked up by Vitest and fail. Do not remove it.

**InputPanel label accessibility.** In [components/input-panel.tsx](components/input-panel.tsx), only the `homePrice` input has `htmlFor="homePrice"` (and thus a proper label association). Down payment, interest rate, and amortization use `<Label>` without `htmlFor` and **cannot** be found by Playwright's `getByLabel()`. Use `getByRole` / `getByText` selectors instead. See [.claude/skills/e2e-testing.md](.claude/skills/e2e-testing.md).

**`FieldWithInfo` must stay at module level.** If you move `FieldWithInfo` inside `InputPanel`, React treats it as a new component type on every render and immediately unmounts/remounts it — the expand/collapse open state resets on every keystroke. Keep it defined outside the parent component.

**Recharts Tooltip formatter types.** The formatter callback receives `ValueType` (`string | number | (string|number)[]`). Guard with `typeof value === "number" ? fmt(value) : value` before calling number formatters.

**Dashboard page heading.** The dashboard `<h1>` is `"Saved mortgage"`. The word "Dashboard" appears only in a `<p>` eyebrow tag (not a heading role). E2e selectors must use `/saved mortgage/i`.

**PowerShell git commit with special characters.** Multiline `@'...'@` here-strings fail when the commit message contains parentheses or `$` — git misinterprets parts as file paths. Use a variable instead: `$msg = "title`n`nbody"; git commit -m $msg`.

**Environment Variables**
- `DATABASE_URL` — required for DB operations; [lib/db.ts](lib/db.ts) throws at import time if missing
