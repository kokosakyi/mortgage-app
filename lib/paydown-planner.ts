import type { MortgageResult, LumpSum, AmortizationSchedule } from "./mortgage-calculator";
import { generateAmortizationSchedule } from "./amortization-schedule";

export interface PaydownGoal {
  type: "target-years" | "target-interest-savings";
  value: number;
}

export interface PaydownScenario {
  label: string;
  summary: string;
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
  label: string,
  summary: string
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
    summary,
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

function fmtAmt(n: number) {
  return `$${Math.round(n).toLocaleString("en-CA")}`;
}

export function calculatePaydownSuggestion(
  mortgage: MortgageResult,
  goal: PaydownGoal
): PaydownSuggestion {
  const baseline = generateAmortizationSchedule(mortgage, []);
  const pLabel = mortgage.periodsPerYear === 12 ? "mo" : "2wk";
  const pWord = mortgage.periodsPerYear === 12 ? "month" : "2 weeks";

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
        scenarios: buildComparisonScenarios(mortgage, [0, 2500, 5000, 10000, 15000]),
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

  const L = lumpSumOnlyAmount ?? 0;
  const P = paymentIncreaseOnly ?? 0;

  // 5 scenarios spanning from all-lump to all-payment
  const weights = [1, 0.75, 0.5, 0.25, 0] as const;
  const scenarios: PaydownScenario[] = weights.map((w) => {
    const lump = Math.round(L * w);
    const payment = Math.round(P * (1 - w));

    let label: string;
    let summary: string;

    if (w === 1) {
      label = `${fmtAmt(lump)}/yr lump sum`;
      summary = `Once a year — at renewal, after a bonus, or at tax time — put ${fmtAmt(lump)} straight onto your principal. No change to your regular payments.`;
    } else if (w === 0) {
      label = `+${fmtAmt(payment)}/${pLabel} on payments`;
      summary = `Increase each regular payment by ${fmtAmt(payment)}. The extra goes directly to principal, and your lender applies it automatically every ${pWord}. No lump sum required.`;
    } else if (w === 0.75) {
      label = `${fmtAmt(lump)}/yr + +${fmtAmt(payment)}/${pLabel}`;
      summary = `Put ${fmtAmt(lump)} toward your mortgage once a year and add a small ${fmtAmt(payment)} bump to each payment. Mostly lump-sum driven — good if your income is irregular.`;
    } else if (w === 0.5) {
      label = `${fmtAmt(lump)}/yr + +${fmtAmt(payment)}/${pLabel}`;
      summary = `Split the effort evenly: ${fmtAmt(lump)} as an annual lump sum and ${fmtAmt(payment)} extra per ${pWord}. Neither commitment feels too large on its own.`;
    } else {
      // w === 0.25 — the recommended option
      label = `${fmtAmt(lump)}/yr + +${fmtAmt(payment)}/${pLabel}`;
      summary = `Boost your regular payment by ${fmtAmt(payment)} per ${pWord} and top it up with a modest ${fmtAmt(lump)} lump sum once a year. The smallest upfront commitment that still makes a meaningful dent.`;
    }

    return buildScenario(mortgage, baseline, lump, payment, label, summary);
  });

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
  return annualAmounts.map((amount) => {
    const monthly = Math.round(amount / 12);
    const label =
      amount === 0 ? "No prepayment" : `${fmtAmt(amount)}/yr lump sum`;
    const summary =
      amount === 0
        ? "Standard scheduled payments only — no changes needed."
        : `Set aside ${fmtAmt(monthly)}/month and make a single ${fmtAmt(amount)} lump-sum payment each year, typically at renewal or when cash flow allows.`;

    return buildScenario(mortgage, baseline, amount, 0, label, summary);
  });
}
