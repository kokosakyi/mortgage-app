# Skill: Extend the Mortgage Calculator

## Files to touch (in dependency order)

1. **`lib/mortgage-calculator.ts`** — core types and math
2. **`lib/amortization-schedule.ts`** — if the new feature affects per-period rates
3. **`__tests__/mortgage-calculator.test.ts`** — unit tests for new math
4. **UI components** — expose new inputs/outputs as needed

## Adding a new payment frequency

1. Add the value to `PaymentFrequency` union type
2. Add a `calculateXxxInterestRate(annualRate)` exported function using the same semi-annual compounding base:
   ```typescript
   const effectiveAnnualRate = Math.pow(1 + r / 2, 2) - 1;
   return Math.pow(1 + effectiveAnnualRate, 1 / <periodsPerYear>) - 1;
   ```
3. Add a case to the `switch` in `calculateMortgage()` setting `paymentAmount` and `periodsPerYear`
4. Update `getPeriodRate()` in `amortization-schedule.ts` to handle the new frequency
5. Add a `<SelectItem>` in `components/input-panel.tsx`
6. Add the frequency label to `FREQUENCY_LABELS` in `components/payment-hero.tsx` and `app/dashboard/page.tsx`

**Critical:** biweekly uses a true PMT recalculation; accelerated-biweekly intentionally uses `monthlyPayment / 2`. Any new "accelerated" variant should follow the same `monthlyPayment / <periodsPerYear>` pattern, not a fresh PMT.

## Adding a new result field to MortgageResult

1. Add to `MortgageResult` interface and populate in `calculateMortgage()`
2. Display in `components/results-panel.tsx` (StatRow) and/or `components/payment-hero.tsx`
3. If it should persist: add to `SavedMortgage` in `lib/mortgage-storage.ts` and display in `app/dashboard/page.tsx`

## Adding a new CMHC tier

Edit `calculateCMHCInsurance()` in `lib/mortgage-calculator.ts`. The tiers as of 2024:
- ≥20%: 0%
- 15–19.99%: 2.8%
- 10–14.99%: 3.1%
- 5–9.99%: 4.0%

## Unit test pattern

Tests call `calculateMortgage(baseInput)` and assert on the result. Use the standard base fixture:
```typescript
const baseInput: MortgageInput = {
  homePrice: 500000,
  downPayment: null,
  downPaymentPercent: 20,
  interestRate: 5.5,
  amortizationYears: 25,
  paymentFrequency: "monthly",
};
```
For biweekly vs monthly math, assert the biweekly amount is **not equal** to `monthlyPayment / 2` but is within ~5% of it.

Run after changes: `pnpm vitest run __tests__/mortgage-calculator.test.ts`
