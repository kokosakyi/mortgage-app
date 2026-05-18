"use client";

import { Button } from "@/components/ui/button";
import type { MortgageResult } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

interface ResultsPanelProps {
  result: MortgageResult;
  onSave: () => void;
  isSaving?: boolean;
}

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium result-number">{value}</span>
    </div>
  );
}

export function ResultsPanel({ result, onSave, isSaving = false }: ResultsPanelProps) {
  return (
    <div className="space-y-1">
      {result.cmhcInsurance > 0 && (
        <div className="rounded-xl bg-accent/60 px-4 py-3 mb-4">
          <p className="text-sm font-medium text-accent-foreground">CMHC insurance required</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            A down payment under 20% requires mortgage default insurance.
          </p>
        </div>
      )}

      <StatRow label="Home price" value={fmt(result.principalAmount + result.downPayment)} />
      <StatRow
        label={`Down payment (${result.downPaymentPercent.toFixed(1)}%)`}
        value={fmt(result.downPayment)}
      />
      <StatRow label="Principal" value={fmt(result.principalAmount)} />
      {result.cmhcInsurance > 0 && (
        <StatRow label="CMHC insurance" value={fmt(result.cmhcInsurance)} />
      )}
      <StatRow label="Total loan amount" value={fmt(result.totalLoanAmount)} />
      <StatRow label="Interest rate" value={`${result.interestRate}%`} />
      <StatRow label="Amortization" value={`${result.amortizationYears} years`} />
      <StatRow label="Total payments" value={result.totalPayments.toLocaleString()} />

      <div className="pt-4">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full h-12 text-base font-semibold"
        >
          {isSaving ? "Saving…" : "Save mortgage"}
        </Button>
      </div>
    </div>
  );
}
