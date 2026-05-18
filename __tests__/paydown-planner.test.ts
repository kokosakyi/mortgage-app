import { describe, it, expect } from "vitest";
import { calculatePaydownSuggestion, buildComparisonScenarios } from "@/lib/paydown-planner";
import { calculateMortgage, type MortgageInput } from "@/lib/mortgage-calculator";

const baseInput: MortgageInput = {
  homePrice: 500000,
  downPayment: null,
  downPaymentPercent: 20,
  interestRate: 5.5,
  amortizationYears: 25,
  paymentFrequency: "monthly",
};

const baseMortgage = calculateMortgage(baseInput);

describe("calculatePaydownSuggestion", () => {
  it("target-years: suggests a non-zero annual lump sum to pay off 5 years early", () => {
    const suggestion = calculatePaydownSuggestion(baseMortgage, {
      type: "target-years",
      value: 20,
    });

    expect(suggestion.lumpSumOnlyAmount).toBeGreaterThan(0);
    expect(suggestion.paymentIncreaseOnly).toBeGreaterThan(0);
    expect(suggestion.scenarios).toHaveLength(3);
  });

  it("target-years: lump sum scenario actually achieves the target", () => {
    const targetYears = 20;
    const suggestion = calculatePaydownSuggestion(baseMortgage, {
      type: "target-years",
      value: targetYears,
    });

    const lumpSumScenario = suggestion.scenarios[0];
    const maxPeriods = targetYears * baseMortgage.periodsPerYear;
    expect(lumpSumScenario.schedule.actualPayoffPeriod).toBeLessThanOrEqual(maxPeriods + 1);
  });

  it("target-interest-savings: suggests appropriate strategy for $50k savings", () => {
    const suggestion = calculatePaydownSuggestion(baseMortgage, {
      type: "target-interest-savings",
      value: 50000,
    });

    expect(suggestion.lumpSumOnlyAmount).toBeGreaterThan(0);
    expect(suggestion.scenarios[0].interestSaved).toBeGreaterThanOrEqual(49000);
  });

  it("target-years: returns early when target is already met", () => {
    const suggestion = calculatePaydownSuggestion(baseMortgage, {
      type: "target-years",
      value: 30,
    });

    expect(suggestion.lumpSumOnlyAmount).toBe(0);
    expect(suggestion.paymentIncreaseOnly).toBe(0);
  });
});

describe("buildComparisonScenarios", () => {
  it("$0/yr scenario has zero interest saved", () => {
    const scenarios = buildComparisonScenarios(baseMortgage, [0, 5000]);
    expect(scenarios[0].interestSaved).toBeCloseTo(0, 0);
  });

  it("increasing lump sums monotonically reduce total interest paid", () => {
    const scenarios = buildComparisonScenarios(baseMortgage, [0, 5000, 10000, 15000]);
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i].interestSaved).toBeGreaterThan(scenarios[i - 1].interestSaved);
    }
  });

  it("returns correct number of scenarios", () => {
    const amounts = [0, 5000, 10000, 15000];
    const scenarios = buildComparisonScenarios(baseMortgage, amounts);
    expect(scenarios).toHaveLength(amounts.length);
  });
});
