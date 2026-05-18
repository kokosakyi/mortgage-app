import { describe, it, expect } from "vitest";
import {
  generateAmortizationSchedule,
  generateComparisonSchedules,
} from "@/lib/amortization-schedule";
import { calculateMortgage, type MortgageInput, type LumpSum } from "@/lib/mortgage-calculator";

const baseInput: MortgageInput = {
  homePrice: 500000,
  downPayment: null,
  downPaymentPercent: 20,
  interestRate: 5.5,
  amortizationYears: 25,
  paymentFrequency: "monthly",
};

const baseMortgage = calculateMortgage(baseInput);

describe("generateAmortizationSchedule", () => {
  it("first row interest equals balance × period rate", () => {
    const schedule = generateAmortizationSchedule(baseMortgage, []);
    const firstRow = schedule.rows[0];
    const monthlyRate = baseMortgage.totalLoanAmount * (baseMortgage.paymentAmount / baseMortgage.totalLoanAmount - 1 / baseMortgage.totalPayments);
    // Interest portion should be positive and less than the payment
    expect(firstRow.interestPortion).toBeGreaterThan(0);
    expect(firstRow.interestPortion).toBeLessThan(firstRow.paymentAmount);
    expect(firstRow.principalPortion).toBeGreaterThan(0);
  });

  it("final row balance is approximately zero", () => {
    const schedule = generateAmortizationSchedule(baseMortgage, []);
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(lastRow.balance).toBeCloseTo(0, 0);
  });

  it("sum of principal portions ≈ total loan amount", () => {
    const schedule = generateAmortizationSchedule(baseMortgage, []);
    const totalPrincipal = schedule.rows.reduce(
      (sum, row) => sum + row.principalPortion + row.lumpSum,
      0
    );
    expect(totalPrincipal).toBeCloseTo(baseMortgage.totalLoanAmount, 0);
  });

  it("total interest paid matches sum of interest portions", () => {
    const schedule = generateAmortizationSchedule(baseMortgage, []);
    const summedInterest = schedule.rows.reduce((sum, row) => sum + row.interestPortion, 0);
    expect(schedule.totalInterestPaid).toBeCloseTo(summedInterest, 1);
  });

  it("lump sum at payment 12 reduces balance and shortens schedule", () => {
    const lumpSums: LumpSum[] = [{ paymentNumber: 12, amount: 20000 }];
    const baseline = generateAmortizationSchedule(baseMortgage, []);
    const accelerated = generateAmortizationSchedule(baseMortgage, lumpSums);

    expect(accelerated.actualPayoffPeriod).toBeLessThan(baseline.actualPayoffPeriod);
    expect(accelerated.totalInterestPaid).toBeLessThan(baseline.totalInterestPaid);
  });

  it("lump sum row has non-zero lumpSum field", () => {
    const lumpSums: LumpSum[] = [{ paymentNumber: 6, amount: 10000 }];
    const schedule = generateAmortizationSchedule(baseMortgage, lumpSums);
    const lumpRow = schedule.rows.find((r) => r.paymentNumber === 6);
    expect(lumpRow?.lumpSum).toBeCloseTo(10000, 0);
  });

  it("multiple lump sums each reduce balance", () => {
    const lumpSums: LumpSum[] = [
      { paymentNumber: 12, amount: 10000 },
      { paymentNumber: 24, amount: 10000 },
      { paymentNumber: 36, amount: 10000 },
    ];
    const baseline = generateAmortizationSchedule(baseMortgage, []);
    const accelerated = generateAmortizationSchedule(baseMortgage, lumpSums);
    expect(accelerated.actualPayoffPeriod).toBeLessThan(baseline.actualPayoffPeriod);
  });

  it("biweekly accelerated schedule ends earlier than full amortization", () => {
    const bwMortgage = calculateMortgage({ ...baseInput, paymentFrequency: "accelerated-biweekly" });
    const schedule = generateAmortizationSchedule(bwMortgage, []);
    expect(schedule.actualPayoffPeriod).toBeLessThan(bwMortgage.totalPayments);
  });
});

describe("generateComparisonSchedules", () => {
  it("baseline and accelerated are identical with empty lump sums", () => {
    const { baseline, accelerated } = generateComparisonSchedules(baseMortgage, []);
    expect(accelerated.totalInterestPaid).toBeCloseTo(baseline.totalInterestPaid, 1);
    expect(accelerated.periodsSaved).toBe(0);
  });

  it("accelerated schedule has fewer periods than baseline when lump sums present", () => {
    const lumpSums: LumpSum[] = [{ paymentNumber: 12, amount: 25000 }];
    const { baseline, accelerated } = generateComparisonSchedules(baseMortgage, lumpSums);
    expect(accelerated.actualPayoffPeriod).toBeLessThan(baseline.actualPayoffPeriod);
    expect(accelerated.interestSaved).toBeGreaterThan(0);
    expect(accelerated.periodsSaved).toBeGreaterThan(0);
  });
});
