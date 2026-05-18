import type {
  MortgageResult,
  LumpSum,
  AmortizationRow,
  AmortizationSchedule,
  PaymentFrequency,
} from "./mortgage-calculator";
import {
  calculateMonthlyInterestRate,
  calculateBiweeklyInterestRate,
} from "./mortgage-calculator";

export function getPeriodRate(annualRate: number, frequency: PaymentFrequency): number {
  if (frequency === "monthly") return calculateMonthlyInterestRate(annualRate);
  return calculateBiweeklyInterestRate(annualRate);
}

function addPeriods(startDate: Date, paymentNumber: number, frequency: PaymentFrequency): Date {
  const d = new Date(startDate);
  if (frequency === "monthly") {
    d.setMonth(d.getMonth() + (paymentNumber - 1));
  } else {
    d.setDate(d.getDate() + (paymentNumber - 1) * 14);
  }
  return d;
}

export function generateAmortizationSchedule(
  mortgage: MortgageResult,
  lumpSums: LumpSum[],
  startDate?: Date
): AmortizationSchedule {
  const start = startDate ?? (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d;
  })();

  const periodRate = getPeriodRate(mortgage.interestRate, mortgage.paymentFrequency);
  const scheduledPayment = mortgage.paymentAmount;

  // Build lump sum map: paymentNumber → total extra principal
  const lumpMap = new Map<number, number>();
  for (const ls of lumpSums) {
    lumpMap.set(ls.paymentNumber, (lumpMap.get(ls.paymentNumber) ?? 0) + ls.amount);
  }

  const rows: AmortizationRow[] = [];
  let balance = mortgage.totalLoanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let pn = 1; pn <= mortgage.totalPayments; pn++) {
    if (balance <= 0.005) break;

    const interestPortion = balance * periodRate;
    // Final payment may be less than scheduled
    const principalPortion = Math.min(scheduledPayment - interestPortion, balance);
    const lumpThisPeriod = Math.min(
      lumpMap.get(pn) ?? 0,
      Math.max(0, balance - principalPortion)
    );

    balance = balance - principalPortion - lumpThisPeriod;
    cumulativeInterest += interestPortion;
    cumulativePrincipal += principalPortion + lumpThisPeriod;

    rows.push({
      paymentNumber: pn,
      date: addPeriods(start, pn, mortgage.paymentFrequency),
      paymentAmount: principalPortion + interestPortion,
      principalPortion,
      interestPortion,
      lumpSum: lumpThisPeriod,
      balance: Math.max(0, balance),
      cumulativeInterest,
      cumulativePrincipal,
    });

    if (balance <= 0.005) break;
  }

  const lastRow = rows[rows.length - 1];

  return {
    rows,
    totalInterestPaid: cumulativeInterest,
    totalPrincipalPaid: cumulativePrincipal,
    actualPayoffPeriod: lastRow?.paymentNumber ?? 0,
    interestSaved: 0,
    periodsSaved: 0,
  };
}

export function generateComparisonSchedules(
  mortgage: MortgageResult,
  lumpSums: LumpSum[],
  startDate?: Date
): { baseline: AmortizationSchedule; accelerated: AmortizationSchedule } {
  const baseline = generateAmortizationSchedule(mortgage, [], startDate);
  const accelerated = lumpSums.length > 0
    ? generateAmortizationSchedule(mortgage, lumpSums, startDate)
    : { ...baseline };

  const interestSaved = baseline.totalInterestPaid - accelerated.totalInterestPaid;
  const periodsSaved = baseline.actualPayoffPeriod - accelerated.actualPayoffPeriod;

  return {
    baseline,
    accelerated: {
      ...accelerated,
      interestSaved,
      periodsSaved,
    },
  };
}
