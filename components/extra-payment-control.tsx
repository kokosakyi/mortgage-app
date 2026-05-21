"use client";

import { Plus, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { MortgageResult } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const PERIOD_LABEL: Record<string, string> = {
  monthly: "/mo",
  biweekly: "/2wk",
  "accelerated-biweekly": "/2wk",
};

const PERIOD_WORD: Record<string, string> = {
  monthly: "monthly",
  biweekly: "bi-weekly",
  "accelerated-biweekly": "accelerated bi-weekly",
};

interface ExtraPaymentControlProps {
  mortgage: MortgageResult;
  extraPayment: number;
  onChange: (value: number) => void;
}

export function ExtraPaymentControl({ mortgage, extraPayment, onChange }: ExtraPaymentControlProps) {
  // Max slider value = 100% of the minimum payment (so you can up to double it)
  const maxExtra = Math.round(mortgage.paymentAmount);
  const sliderStep = mortgage.paymentAmount > 1000 ? 25 : 10;
  const newPayment = mortgage.paymentAmount + extraPayment;
  const periodLabel = PERIOD_LABEL[mortgage.paymentFrequency] ?? "";
  const periodWord = PERIOD_WORD[mortgage.paymentFrequency] ?? "";

  return (
    <div className="rounded-2xl bg-card shadow-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">Extra per payment</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pay more than the minimum {periodWord} payment of{" "}
            <span className="font-medium text-foreground result-number">{fmt(mortgage.paymentAmount)}</span>.
            The extra goes straight to principal.
          </p>
        </div>
        {extraPayment > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Slider
          min={0}
          max={maxExtra}
          step={sliderStep}
          value={[Math.min(extraPayment, maxExtra)]}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <div className="relative w-28">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            className="pl-7 pr-2 text-right"
            value={extraPayment}
            min={0}
            step={sliderStep}
            onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Your payment</p>
          <p className="font-semibold result-number text-base">
            {fmt(newPayment)}
            <span className="text-xs text-muted-foreground font-normal ml-1">{periodLabel}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Extra to principal</p>
          <p className="font-semibold result-number text-base text-primary">
            +{fmt(extraPayment)}
            <span className="text-xs text-muted-foreground font-normal ml-1">{periodLabel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
