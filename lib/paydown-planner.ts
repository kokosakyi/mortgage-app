import type { MortgageResult, LumpSum, AmortizationSchedule } from "./mortgage-calculator";
import { generateAmortizationSchedule } from "./amortization-schedule";

export interface PaydownGoal {
  type: "target-years" | "target-interest-savings";
  value: number;
}

export interface PaydownScenario {
  label: string;
  extraAnnualLumpSum: number;
  extraPeriodicPayment: number;
  schedule: AmortizationSchedule;
  interestSaved: number;
  timeSavedYears: number;
  timeSavedMonths: number;
  newPayoffDate: Date;
}

export interface PaydownSuggestion {
  targetDescription: string;
  lumpSumOnlyAmount: number | null;
  paymentIncreaseOnly: number | null;
  scenarios: PaydownScenario[];
}

function buildAnnualLumpSums(annualAmount: number, mortgage: MortgageResult): LumpSum[] {
  if (annualAmount <= 0) return [];
  const lumpSums: LumpSum[] = [];
  for (let yr = 1; yr <= mortgage.amortizationYears; yr++) {
    const pn = yr * mortgage.periodsPerYear;
    if (pn <= mortgage.totalPayments) {
      lumpSums.push({ paymentNumber: pn, amount: annualAmount });
    }
  }
  return lumpSums;
}

function buildIncreasedPaymentMortgage(
  mortgage: MortgageResult,
  extraPerPeriod: number
): MortgageResult {
  return { ...mortgage, paymentAmount: mortgage.paymentAmount + extraPerPeriod };
}

function periodsToYearsMonths(periods: number, periodsPerYear: number) {
  const totalMonths = Math.round((periods / periodsPerYear) * 12);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

function payoffDate(schedule: AmortizationSchedule): Date {
  return schedule.rows[schedule.rows.length - 1]?.date ?? new Date();
}

function buildScenario(
  mortgage: MortgageResult,
  baseline: AmortizationSchedule,
  extraAnnualLumpSum: number,
  extraPeriodicPayment: number,
  label: string
): PaydownScenario {
  let schedule: AmortizationSchedule;
  if (extraAnnualLumpSum > 0 && extraPeriodicPayment === 0) {
    schedule = generateAmortizationSchedule(
      mortgage,
      buildAnnualLumpSums(extraAnnualLumpSum, mortgage)
    );
  } else if (extraPeriodicPayment > 0 && extraAnnualLumpSum === 0) {
    schedule = generateAmortizationSchedule(
      buildIncreasedPaymentMortgage(mortgage, extraPeriodicPayment),
      []
    );
  } else {
    schedule = generateAmortizationSchedule(
      buildIncreasedPaymentMortgage(mortgage, extraPeriodicPayment),
      buildAnnualLumpSums(extraAnnualLumpSum, mortgage)
    );
  }

  const interestSaved = baseline.totalInterestPaid - schedule.totalInterestPaid;
  const periodsSaved = baseline.actualPayoffPeriod - schedule.actualPayoffPeriod;
  const { years, months } = periodsToYearsMonths(periodsSaved, mortgage.periodsPerYear);

  return {
    label,
    extraAnnualLumpSum,
    extraPeriodicPayment,
    schedule,
    interestSaved,
    timeSavedYears: years,
    timeSavedMonths: months,
    newPayoffDate: payoffDate(schedule),
  };
}

// Binary search for annual lump sum to hit target payoff period
function findRequiredAnnualLumpSum(
  mortgage: MortgageResult,
  targetPeriods: number
): number {
  let low = 0;
  let high = mortgage.totalLoanAmount;

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const schedule = generateAmortizationSchedule(
      mortgage,
      buildAnnualLumpSums(mid, mortgage)
    );
    if (schedule.actualPayoffPeriod <= targetPeriods) {
      high = mid;
    } else {
      low = mid;
    }
    if (high - low < 1) break;
  }

  return Math.ceil(high);
}

// Binary search for per-period payment increase to hit target payoff period
function findRequiredPaymentIncrease(
  mortgage: MortgageResult,
  targetPeriods: number
): number {
  let low = 0;
  let high = mortgage.paymentAmount * 2;

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const schedule = generateAmortizationSchedule(
      buildIncreasedPaymentMortgage(mortgage, mid),
      []
    );
    if (schedule.actualPayoffPeriod <= targetPeriods) {
      high = mid;
    } else {
      low = mid;
    }
    if (high - low < 0.5) break;
  }

  return Math.ceil(high);
}

// Binary search for annual lump sum to achieve interest savings target
function findLumpSumForInterestSavings(
  mortgage: MortgageResult,
  baseline: AmortizationSchedule,
  targetSavings: number
): number {
  if (targetSavings >= baseline.totalInterestPaid) return mortgage.totalLoanAmount;

  let low = 0;
  let high = mortgage.totalLoanAmount;

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const schedule = generateAmortizationSchedule(
      mortgage,
      buildAnnualLumpSums(mid, mortgage)
    );
    const saved = baseline.totalInterestPaid - schedule.totalInterestPaid;
    if (saved >= targetSavings) {
      high = mid;
    } else {
      low = mid;
    }
    if (high - low < 1) break;
  }

  return Math.ceil(high);
}

export function calculatePaydownSuggestion(
  mortgage: MortgageResult,
  goal: PaydownGoal
): PaydownSuggestion {
  const baseline = generateAmortizationSchedule(mortgage, []);

  let lumpSumOnlyAmount: number | null = null;
  let paymentIncreaseOnly: number | null = null;
  let targetDescription = "";

  if (goal.type === "target-years") {
    const targetPeriods = Math.round(goal.value * mortgage.periodsPerYear);
    if (targetPeriods >= baseline.actualPayoffPeriod) {
      return {
        targetDescription: "Target already met — no extra payments needed.",
        lumpSumOnlyAmount: 0,
        paymentIncreaseOnly: 0,
        scenarios: buildComparisonScenarios(mortgage, [0, 5000, 10000, 15000]),
      };
    }
    lumpSumOnlyAmount = findRequiredAnnualLumpSum(mortgage, targetPeriods);
    paymentIncreaseOnly = findRequiredPaymentIncrease(mortgage, targetPeriods);
    targetDescription = `Pay off in ${goal.value} years`;
  } else {
    if (goal.value >= baseline.totalInterestPaid) {
      lumpSumOnlyAmount = mortgage.totalLoanAmount;
      paymentIncreaseOnly = mortgage.paymentAmount * 2;
    } else {
      lumpSumOnlyAmount = findLumpSumForInterestSavings(mortgage, baseline, goal.value);
      // For interest savings, payment increase uses same binary search approach
      let low = 0;
      let high = mortgage.paymentAmount * 2;
      for (let i = 0; i < 40; i++) {
        const mid = (low + high) / 2;
        const schedule = generateAmortizationSchedule(
          buildIncreasedPaymentMortgage(mortgage, mid),
          []
        );
        const saved = baseline.totalInterestPaid - schedule.totalInterestPaid;
        if (saved >= goal.value) high = mid;
        else low = mid;
        if (high - low < 0.5) break;
      }
      paymentIncreaseOnly = Math.ceil(high);
    }
    targetDescription = `Save $${goal.value.toLocaleString("en-CA")} in interest`;
  }

  const halfLump = lumpSumOnlyAmount ? lumpSumOnlyAmount / 2 : 0;
  const halfPayment = paymentIncreaseOnly ? paymentIncreaseOnly / 2 : 0;

  const scenarios: PaydownScenario[] = [
    buildScenario(mortgage, baseline, lumpSumOnlyAmount ?? 0, 0,
      `$${(lumpSumOnlyAmount ?? 0).toLocaleString("en-CA")}/yr lump sum only`),
    buildScenario(mortgage, baseline, 0, paymentIncreaseOnly ?? 0,
      `+$${(paymentIncreaseOnly ?? 0).toLocaleString("en-CA")}/${mortgage.periodsPerYear === 12 ? "mo" : "2wk"} payment only`),
    buildScenario(mortgage, baseline, halfLump, halfPayment,
      `Combined: $${Math.round(halfLump).toLocaleString("en-CA")}/yr + +$${Math.round(halfPayment).toLocaleString("en-CA")}/${mortgage.periodsPerYear === 12 ? "mo" : "2wk"}`),
  ];

  return {
    targetDescription,
    lumpSumOnlyAmount,
    paymentIncreaseOnly,
    scenarios,
  };
}

export function buildComparisonScenarios(
  mortgage: MortgageResult,
  annualAmounts: number[]
): PaydownScenario[] {
  const baseline = generateAmortizationSchedule(mortgage, []);
  return annualAmounts.map((amount) =>
    buildScenario(
      mortgage,
      baseline,
      amount,
      0,
      amount === 0
        ? "No prepayment"
        : `$${amount.toLocaleString("en-CA")}/yr lump sum`
    )
  );
}
