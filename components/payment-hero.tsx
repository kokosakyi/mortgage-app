"use client";

import type { MortgageResult } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "per month",
  biweekly: "every 2 weeks",
  "accelerated-biweekly": "every 2 weeks (accelerated)",
};

interface PaymentHeroProps {
  result: MortgageResult;
}

export function PaymentHero({ result }: PaymentHeroProps) {
  const principalPct = Math.round((result.principalAmount / result.totalAmountPaid) * 100);
  const interestPct = 100 - principalPct;

  return (
    <div className="rounded-2xl bg-card shadow-card p-8 mb-8">
      <p className="text-sm font-medium text-muted-foreground mb-1">Your payment</p>
      <div className="flex items-end gap-3 mb-1">
        <span className="text-5xl md:text-6xl font-bold text-primary result-number">
          {fmt(result.paymentAmount)}
        </span>
        <span className="text-muted-foreground mb-2 text-base">
          {FREQUENCY_LABELS[result.paymentFrequency]}
        </span>
      </div>

      {/* Split progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden mt-4 mb-6 gap-0.5">
        <div
          className="bg-primary rounded-l-full transition-all duration-500"
          style={{ width: `${principalPct}%` }}
        />
        <div
          className="bg-chart-4 rounded-r-full transition-all duration-500"
          style={{ width: `${interestPct}%` }}
        />
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Principal</p>
          <p className="font-semibold result-number">{fmt(result.principalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Total interest</p>
          <p className="font-semibold result-number text-chart-4">{fmt(result.totalInterest)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Total cost</p>
          <p className="font-semibold result-number">{fmt(result.totalAmountPaid)}</p>
        </div>
      </div>
    </div>
  );
}
