"use client";

import { Building2, TrendingDown, Wallet, CreditCard } from "lucide-react";
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
    <div className="rounded-2xl bg-card shadow-card p-8 mb-8 animate-fade-in-up">
      <div className="flex items-center gap-1.5 mb-1">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Your payment</p>
      </div>
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
          <div className="flex items-center gap-1 mb-0.5">
            <Building2 className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Principal</p>
          </div>
          <p className="font-semibold result-number">{fmt(result.principalAmount)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-chart-4" />
            <p className="text-xs text-muted-foreground">Total interest</p>
          </div>
          <p className="font-semibold result-number text-chart-4">{fmt(result.totalInterest)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <Wallet className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total cost</p>
          </div>
          <p className="font-semibold result-number">{fmt(result.totalAmountPaid)}</p>
        </div>
      </div>
    </div>
  );
}
