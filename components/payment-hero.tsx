"use client";

import { Building2, TrendingDown, Wallet, ArrowUpRight } from "lucide-react";
import type { MortgageResult } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "per month",
  biweekly: "every 2 weeks",
  "accelerated-biweekly": "every 2 weeks · accelerated",
};

interface PaymentHeroProps {
  result: MortgageResult;
}

export function PaymentHero({ result }: PaymentHeroProps) {
  const principalPct = Math.round((result.principalAmount / result.totalAmountPaid) * 100);
  const interestPct = 100 - principalPct;

  return (
    <div className="relative rounded-3xl bg-card shadow-card overflow-hidden mb-6 md:mb-8 animate-fade-in-up">
      {/* Decorative gradient */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse 40% 60% at 0% 100%, hsl(var(--chart-2) / 0.10), transparent 55%)",
        }}
      />

      <div className="relative p-6 sm:p-8 md:p-10">
        {/* Eyebrow */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your payment
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 border border-border/60 text-[11px] text-muted-foreground">
            <ArrowUpRight className="w-3 h-3" />
            Live
          </div>
        </div>

        {/* The big number */}
        <div className="flex items-end flex-wrap gap-x-3 gap-y-1 mb-1">
          <span className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-foreground result-number tracking-tight leading-none">
            {fmt(result.paymentAmount)}
          </span>
          <span className="text-muted-foreground text-sm sm:text-base pb-2">
            {FREQUENCY_LABELS[result.paymentFrequency]}
          </span>
        </div>

        {/* Split progress bar */}
        <div className="mt-6 mb-2">
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
            <div
              className="bg-primary rounded-l-full transition-all duration-500"
              style={{ width: `${principalPct}%` }}
            />
            <div
              className="bg-chart-4/80 rounded-r-full transition-all duration-500"
              style={{ width: `${interestPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
            <span><span className="text-foreground font-medium">{principalPct}%</span> principal</span>
            <span><span className="text-foreground font-medium">{interestPct}%</span> interest</span>
          </div>
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-6 border-t border-border">
          <StatChip
            icon={<Building2 className="w-3.5 h-3.5" />}
            label="Principal"
            value={fmt(result.principalAmount)}
            tone="default"
          />
          <StatChip
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            label="Total interest"
            value={fmt(result.totalInterest)}
            tone="warn"
          />
          <StatChip
            icon={<Wallet className="w-3.5 h-3.5" />}
            label="Total cost"
            value={fmt(result.totalAmountPaid)}
            tone="default"
          />
        </div>
      </div>
    </div>
  );
}

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warn";
}

function StatChip({ icon, label, value, tone = "default" }: StatChipProps) {
  const valueClass = tone === "warn" ? "text-chart-4" : "text-foreground";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 mb-1 text-muted-foreground">
        {icon}
        <p className="text-[11px] sm:text-xs truncate">{label}</p>
      </div>
      <p className={`font-semibold text-sm sm:text-base result-number truncate ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
