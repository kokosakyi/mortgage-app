"use client";

import { Button } from "@/components/ui/button";
import { Shield, Bookmark, ArrowRight } from "lucide-react";
import type { MortgageResult } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

interface ResultsPanelProps {
  result: MortgageResult;
  onSave: () => void;
  isSaving?: boolean;
  startDate: Date;
}

interface StatRowProps {
  label: string;
  value: string;
  emphasized?: boolean;
}

function StatRow({ label, value, emphasized }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border/70 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`result-number ${
          emphasized ? "font-semibold text-foreground text-base" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function ResultsPanel({ result, onSave, isSaving = false, startDate }: ResultsPanelProps) {
  return (
    <div className="space-y-1">
      {result.cmhcInsurance > 0 && (
        <div className="rounded-xl bg-accent/60 border border-border/60 px-4 py-3 mb-4 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent-foreground">CMHC insurance required</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A down payment under 20% requires mortgage default insurance.
            </p>
          </div>
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
      <StatRow label="Total loan amount" value={fmt(result.totalLoanAmount)} emphasized />
      <StatRow label="Interest rate" value={`${result.interestRate}%`} />
      <StatRow label="Amortization" value={`${result.amortizationYears} years`} />
      <StatRow label="Total payments" value={result.totalPayments.toLocaleString()} />
      <StatRow label="First payment" value={fmtDate(startDate)} />

      <div className="pt-5">
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="lg"
          className="w-full font-semibold group"
        >
          {isSaving ? (
            "Saving…"
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Save mortgage
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
