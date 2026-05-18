/**
 * Canadian Mortgage Calculator
 * Implements Canadian mortgage calculations with semi-annual compounding
 */

export type PaymentFrequency = "monthly" | "biweekly" | "accelerated-biweekly";

export interface MortgageInput {
  homePrice: number;
  downPayment: number | null;
  downPaymentPercent: number | null;
  interestRate: number; // Annual rate as percentage (e.g., 5.5 for 5.5%)
  amortizationYears: number;
  paymentFrequency: PaymentFrequency;
}

export interface MortgageResult {
  principalAmount: number;
  downPayment: number;
  downPaymentPercent: number;
  cmhcInsurance: number;
  totalLoanAmount: number;
  monthlyPayment: number;
  paymentAmount: number; // Payment based on selected frequency
  periodsPerYear: number; // 12 for monthly, 26 for biweekly/accelerated-biweekly
  totalPayments: number;
  totalInterest: number;
  totalAmountPaid: number;
  interestRate: number;
  amortizationYears: number;
  paymentFrequency: PaymentFrequency;
}

export interface LumpSum {
  paymentNumber: number;
  amount: number;
  label?: string;
}

export interface AmortizationRow {
  paymentNumber: number;
  date: Date;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  lumpSum: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationSchedule {
  rows: AmortizationRow[];
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  actualPayoffPeriod: number;
  interestSaved: number;
  periodsSaved: number;
}

/**
 * Calculate CMHC insurance premium based on down payment percentage
 * CMHC insurance is required for down payments less than 20%
 */
export function calculateCMHCInsurance(
  loanAmount: number,
  downPaymentPercent: number
): number {
  if (downPaymentPercent >= 20) {
    return 0;
  }

  // CMHC premium rates (as of 2024)
  let premiumRate = 0;
  if (downPaymentPercent >= 15 && downPaymentPercent < 20) {
    premiumRate = 0.028; // 2.8%
  } else if (downPaymentPercent >= 10 && downPaymentPercent < 15) {
    premiumRate = 0.031; // 3.1%
  } else if (downPaymentPercent >= 5 && downPaymentPercent < 10) {
    premiumRate = 0.04; // 4.0%
  } else {
    premiumRate = 0; // Minimum 5% down payment required
  }

  return loanAmount * premiumRate;
}

/**
 * Convert annual interest rate to monthly rate with semi-annual compounding
 * Canadian mortgages use semi-annual compounding: (1 + r/2)^2 = 1 + i
 * Where r is the annual rate and i is the effective annual rate
 * Monthly rate = (1 + effective_annual_rate)^(1/12) - 1
 */
export function calculateMonthlyInterestRate(annualRate: number): number {
  // Annual rate as decimal (e.g., 5.5% = 0.055)
  const r = annualRate / 100;
  
  // Effective annual rate with semi-annual compounding
  const effectiveAnnualRate = Math.pow(1 + r / 2, 2) - 1;
  
  // Monthly interest rate
  const monthlyRate = Math.pow(1 + effectiveAnnualRate, 1 / 12) - 1;
  
  return monthlyRate;
}

/**
 * Convert annual interest rate to biweekly rate with semi-annual compounding.
 * Same effective annual rate base as monthly, but 26 periods per year.
 */
export function calculateBiweeklyInterestRate(annualRate: number): number {
  const r = annualRate / 100;
  const effectiveAnnualRate = Math.pow(1 + r / 2, 2) - 1;
  return Math.pow(1 + effectiveAnnualRate, 1 / 26) - 1;
}

/**
 * Calculate number of payments based on frequency and amortization period
 */
export function calculateNumberOfPayments(
  amortizationYears: number,
  paymentFrequency: PaymentFrequency
): number {
  switch (paymentFrequency) {
    case "monthly":
      return amortizationYears * 12;
    case "biweekly":
      return amortizationYears * 26; // 52 weeks / 2
    case "accelerated-biweekly":
      return amortizationYears * 26; // Same number of payments, but amount is half of monthly
    default:
      return amortizationYears * 12;
  }
}

/**
 * Calculate mortgage payment using Canadian formula
 * PMT = PV × [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * - PV = Present Value (principal)
 * - r = monthly interest rate
 * - n = number of payments
 */
export function calculatePayment(
  principal: number,
  monthlyInterestRate: number,
  numberOfPayments: number
): number {
  if (monthlyInterestRate === 0) {
    return principal / numberOfPayments;
  }

  const numerator = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;
  
  return numerator / denominator;
}


/**
 * Main mortgage calculation function
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  // Calculate down payment
  let downPayment: number;
  let downPaymentPercent: number;
  
  if (input.downPayment !== null) {
    downPayment = input.downPayment;
    downPaymentPercent = (downPayment / input.homePrice) * 100;
  } else if (input.downPaymentPercent !== null) {
    downPaymentPercent = input.downPaymentPercent;
    downPayment = (input.homePrice * downPaymentPercent) / 100;
  } else {
    // Default to 20%
    downPaymentPercent = 20;
    downPayment = (input.homePrice * downPaymentPercent) / 100;
  }

  // Calculate principal (loan amount before CMHC)
  const principalAmount = input.homePrice - downPayment;

  // Calculate CMHC insurance
  const cmhcInsurance = calculateCMHCInsurance(principalAmount, downPaymentPercent);
  
  // Total loan amount (principal + CMHC insurance)
  const totalLoanAmount = principalAmount + cmhcInsurance;

  // Calculate monthly interest rate with semi-annual compounding
  const monthlyInterestRate = calculateMonthlyInterestRate(input.interestRate);

  // Calculate number of payments
  const numberOfPayments = calculateNumberOfPayments(
    input.amortizationYears,
    input.paymentFrequency
  );

  // Calculate monthly payment (used as reference and for accelerated-biweekly)
  const monthlyPayment = calculatePayment(
    totalLoanAmount,
    monthlyInterestRate,
    input.amortizationYears * 12
  );

  // Calculate payment amount and periods per year based on frequency
  let paymentAmount: number;
  let periodsPerYear: number;
  switch (input.paymentFrequency) {
    case "biweekly": {
      // Recalculate PMT with proper biweekly period rate (not monthly / 2)
      const bwRate = calculateBiweeklyInterestRate(input.interestRate);
      paymentAmount = calculatePayment(totalLoanAmount, bwRate, input.amortizationYears * 26);
      periodsPerYear = 26;
      break;
    }
    case "accelerated-biweekly":
      // Intentionally half of monthly payment, paid 26×/year ≈ 13 monthly equivalents
      paymentAmount = monthlyPayment / 2;
      periodsPerYear = 26;
      break;
    default:
      paymentAmount = monthlyPayment;
      periodsPerYear = 12;
  }

  // Total amount paid over the full scheduled amortization
  const totalAmountPaid = paymentAmount * numberOfPayments;

  // Calculate total interest
  const totalInterest = totalAmountPaid - totalLoanAmount;

  return {
    principalAmount,
    downPayment,
    downPaymentPercent,
    cmhcInsurance,
    totalLoanAmount,
    monthlyPayment,
    paymentAmount,
    periodsPerYear,
    totalPayments: numberOfPayments,
    totalInterest,
    totalAmountPaid,
    interestRate: input.interestRate,
    amortizationYears: input.amortizationYears,
    paymentFrequency: input.paymentFrequency,
  };
}
