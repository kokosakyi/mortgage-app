import { describe, it, expect } from "vitest";
import {
  calculateMortgage,
  calculateCMHCInsurance,
  calculateMonthlyInterestRate,
  calculateBiweeklyInterestRate,
  calculatePayment,
  type MortgageInput,
  type PaymentFrequency,
} from "@/lib/mortgage-calculator";

describe("Mortgage Calculator", () => {
  describe("calculateCMHCInsurance", () => {
    it("should return 0 for down payment >= 20%", () => {
      expect(calculateCMHCInsurance(400000, 20)).toBe(0);
      expect(calculateCMHCInsurance(400000, 25)).toBe(0);
    });

    it("should calculate 2.8% premium for 15-19.99% down payment", () => {
      const result = calculateCMHCInsurance(400000, 15);
      expect(result).toBe(400000 * 0.028);
    });

    it("should calculate 3.1% premium for 10-14.99% down payment", () => {
      const result = calculateCMHCInsurance(400000, 10);
      expect(result).toBe(400000 * 0.031);
    });

    it("should calculate 4.0% premium for 5-9.99% down payment", () => {
      const result = calculateCMHCInsurance(400000, 5);
      expect(result).toBe(400000 * 0.04);
    });
  });

  describe("calculateMonthlyInterestRate", () => {
    it("should calculate correct monthly rate with semi-annual compounding", () => {
      // For 5% annual rate with semi-annual compounding:
      // Effective annual = (1 + 0.05/2)^2 - 1 = 0.050625
      // Monthly rate = (1.050625)^(1/12) - 1 ≈ 0.004124
      const rate = calculateMonthlyInterestRate(5);
      expect(rate).toBeCloseTo(0.004124, 5);
    });

    it("should handle 0% interest rate", () => {
      const rate = calculateMonthlyInterestRate(0);
      expect(rate).toBe(0);
    });

    it("should handle high interest rates", () => {
      const rate = calculateMonthlyInterestRate(10);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(0.01); // Should be less than 1% monthly
    });
  });

  describe("calculateBiweeklyInterestRate", () => {
    it("should return a rate lower than monthly rate", () => {
      const bwRate = calculateBiweeklyInterestRate(5);
      const mRate = calculateMonthlyInterestRate(5);
      expect(bwRate).toBeLessThan(mRate);
    });

    it("should satisfy (1 + bwRate)^26 - 1 ≈ effectiveAnnualRate", () => {
      const bwRate = calculateBiweeklyInterestRate(5);
      const effectiveAnnual = Math.pow(1 + 0.05 / 2, 2) - 1;
      expect(Math.pow(1 + bwRate, 26) - 1).toBeCloseTo(effectiveAnnual, 8);
    });

    it("should handle 0% interest rate", () => {
      expect(calculateBiweeklyInterestRate(0)).toBe(0);
    });
  });

  describe("calculatePayment", () => {
    it("should calculate payment for zero interest", () => {
      const payment = calculatePayment(400000, 0, 300);
      expect(payment).toBeCloseTo(400000 / 300, 2);
    });

    it("should calculate standard mortgage payment", () => {
      const principal = 400000;
      const monthlyRate = calculateMonthlyInterestRate(5);
      const numberOfPayments = 25 * 12; // 25 years
      const payment = calculatePayment(principal, monthlyRate, numberOfPayments);
      
      expect(payment).toBeGreaterThan(0);
      expect(payment * numberOfPayments).toBeGreaterThan(principal);
    });
  });

  describe("calculateMortgage - Full Calculation", () => {
    const baseInput: MortgageInput = {
      homePrice: 500000,
      downPayment: null,
      downPaymentPercent: 20,
      interestRate: 5.5,
      amortizationYears: 25,
      paymentFrequency: "monthly",
    };

    it("should calculate mortgage with 20% down payment (no CMHC)", () => {
      const result = calculateMortgage(baseInput);
      
      expect(result.downPayment).toBe(100000);
      expect(result.downPaymentPercent).toBe(20);
      expect(result.principalAmount).toBe(400000);
      expect(result.cmhcInsurance).toBe(0);
      expect(result.totalLoanAmount).toBe(400000);
      expect(result.paymentAmount).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it("should calculate CMHC insurance for 10% down payment", () => {
      const input = { ...baseInput, downPaymentPercent: 10 };
      const result = calculateMortgage(input);
      
      expect(result.downPayment).toBe(50000);
      expect(result.principalAmount).toBe(450000);
      expect(result.cmhcInsurance).toBe(450000 * 0.031); // 3.1% for 10% down
      expect(result.totalLoanAmount).toBe(450000 + result.cmhcInsurance);
    });

    it("should calculate with down payment amount instead of percent", () => {
      const input = {
        ...baseInput,
        downPayment: 75000,
        downPaymentPercent: null,
      };
      const result = calculateMortgage(input);
      
      expect(result.downPayment).toBe(75000);
      expect(result.downPaymentPercent).toBe(15);
      expect(result.principalAmount).toBe(425000);
    });

    it("should calculate monthly payments correctly", () => {
      const result = calculateMortgage(baseInput);
      
      // Monthly payment should be reasonable (between 2000-3000 for 400k at 5.5%)
      expect(result.monthlyPayment).toBeGreaterThan(2000);
      expect(result.monthlyPayment).toBeLessThan(3000);
      expect(result.paymentAmount).toBe(result.monthlyPayment);
    });

    it("should calculate biweekly payments correctly using proper biweekly period rate", () => {
      const input = { ...baseInput, paymentFrequency: "biweekly" as PaymentFrequency };
      const result = calculateMortgage(input);

      expect(result.paymentFrequency).toBe("biweekly");
      expect(result.periodsPerYear).toBe(26);
      expect(result.totalPayments).toBe(25 * 26);
      // Biweekly PMT is recalculated with biweekly rate — NOT monthlyPayment / 2
      expect(result.paymentAmount).not.toBeCloseTo(result.monthlyPayment / 2, 0);
      // But it should be in the same ballpark (within 5%)
      expect(result.paymentAmount).toBeGreaterThan(result.monthlyPayment * 0.45);
      expect(result.paymentAmount).toBeLessThan(result.monthlyPayment * 0.55);
    });

    it("should calculate accelerated biweekly payments correctly", () => {
      const input = { ...baseInput, paymentFrequency: "accelerated-biweekly" as PaymentFrequency };
      const result = calculateMortgage(input);

      expect(result.paymentFrequency).toBe("accelerated-biweekly");
      expect(result.periodsPerYear).toBe(26);
      // Accelerated biweekly: intentionally half of monthly, paid 26×/year
      expect(result.paymentAmount).toBeCloseTo(result.monthlyPayment / 2, 2);
      // 26 payments/year × (monthlyPayment/2) > 12 × monthlyPayment
      expect(result.totalAmountPaid).toBeGreaterThan(result.monthlyPayment * 12 * 25);
    });

    it("should calculate total interest correctly", () => {
      const result = calculateMortgage(baseInput);
      
      expect(result.totalAmountPaid).toBe(result.totalLoanAmount + result.totalInterest);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it("should handle edge case: 30 year amortization", () => {
      const input = { ...baseInput, amortizationYears: 30 };
      const result = calculateMortgage(input);
      
      expect(result.amortizationYears).toBe(30);
      expect(result.totalPayments).toBe(30 * 12);
      expect(result.monthlyPayment).toBeLessThan(
        calculateMortgage({ ...baseInput, amortizationYears: 25 }).monthlyPayment
      );
    });

    it("should handle edge case: high interest rate", () => {
      const input = { ...baseInput, interestRate: 10 };
      const result = calculateMortgage(input);
      
      expect(result.interestRate).toBe(10);
      expect(result.monthlyPayment).toBeGreaterThan(
        calculateMortgage(baseInput).monthlyPayment
      );
      expect(result.totalInterest).toBeGreaterThan(
        calculateMortgage(baseInput).totalInterest
      );
    });
  });
});
