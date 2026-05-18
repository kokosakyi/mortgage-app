# Canadian Mortgage Calculator

A smart mortgage calculator built for Canadian mortgages. Calculate payments, plan lump-sum prepayments, run paydown scenarios, and see your full amortization schedule — all in your browser with no account required.

## Features

- **Accurate Canadian math** — semi-annual compounding, proper biweekly period rates (not monthly ÷ 2), CMHC insurance tiers
- **Payment frequencies** — monthly, bi-weekly, and accelerated bi-weekly
- **Amortization schedule** — full payment-by-payment table with dates, paginated and highlighted for lump-sum rows
- **Lump sum prepayments** — add extra principal payments at any point in the schedule and see the updated balance chart and interest savings
- **Smart paydown planner** — set a target payoff year or interest savings goal; the planner back-solves the exact annual lump sum or payment increase needed
- **Balance chart** — Recharts line chart comparing baseline vs. accelerated payoff
- **Save to dashboard** — persists one mortgage per browser via localStorage (no backend required)

## Tech Stack

- **Next.js 15** (App Router), React 18, TypeScript strict mode
- **Tailwind CSS + shadcn/ui** (Radix UI primitives), Wealthsimple-inspired teal theme
- **Recharts** for the balance-over-time chart
- **Drizzle ORM + PostgreSQL** schema in place for future multi-user support
- **Vitest** (unit tests), **Playwright** (e2e tests)
- **pnpm** package manager

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

First-time e2e setup:
```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm test         # unit tests (38 tests)
pnpm test:e2e     # e2e tests (11 tests, starts dev server automatically)
pnpm lint
```

## Deployment

Vercel is the recommended host — it auto-detects Next.js. No environment variables required for the localStorage-only flow. If connecting a database, set `DATABASE_URL`.

1. Push to GitHub (see `.claude/skills/deploy-to-github.md` for the steps)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Deploy — no configuration needed for the basic app

## Canadian Mortgage Math

```
effectiveAnnualRate = (1 + annualRate/2)^2 - 1          # semi-annual compounding
monthlyRate         = (1 + effectiveAnnualRate)^(1/12) - 1
biweeklyRate        = (1 + effectiveAnnualRate)^(1/26) - 1
PMT = PV × [r(1+r)^n] / [(1+r)^n - 1]
```

Accelerated bi-weekly = `monthlyPayment / 2` paid 26×/year ≈ 13 monthly payments/year.

CMHC insurance tiers: 4% (<10% down), 3.1% (10–14.99%), 2.8% (15–19.99%), 0% (≥20%).

## License

MIT
