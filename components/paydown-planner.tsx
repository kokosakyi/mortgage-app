"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MortgageResult } from "@/lib/mortgage-calculator";
import {
  calculatePaydownSuggestion,
  buildComparisonScenarios,
  type PaydownSuggestion,
  type PaydownScenario,
} from "@/lib/paydown-planner";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

function ScenarioCard({ scenario, isTarget }: { scenario: PaydownScenario; isTarget?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl p-5 border transition-all",
      isTarget
        ? "border-primary bg-primary/5 shadow-card"
        : "border-border bg-card shadow-card"
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold leading-snug">{scenario.label}</p>
        {isTarget && <Badge variant="default" className="shrink-0 text-xs">Recommended</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Interest saved</p>
          <p className="font-semibold text-primary result-number">{fmt(scenario.interestSaved)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Time saved</p>
          <p className="font-semibold result-number">
            {scenario.timeSavedYears > 0 ? `${scenario.timeSavedYears}y ` : ""}
            {scenario.timeSavedMonths > 0 ? `${scenario.timeSavedMonths}m` : ""}
            {scenario.timeSavedYears === 0 && scenario.timeSavedMonths === 0 ? "—" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">New payoff</p>
          <p className="font-medium text-sm result-number">
            {new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short" }).format(scenario.newPayoffDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface PaydownPlannerProps {
  mortgage: MortgageResult;
}

export function PaydownPlanner({ mortgage }: PaydownPlannerProps) {
  const [goalType, setGoalType] = useState<"target-years" | "target-interest-savings">("target-years");
  const [targetYears, setTargetYears] = useState(Math.max(5, mortgage.amortizationYears - 5));
  const [targetSavings, setTargetSavings] = useState(25000);
  const [suggestion, setSuggestion] = useState<PaydownSuggestion | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const comparisonScenarios = buildComparisonScenarios(mortgage, [0, 5000, 10000, 15000]);

  function handleCalculate() {
    setIsCalculating(true);
    setTimeout(() => {
      const result = calculatePaydownSuggestion(mortgage, {
        type: goalType,
        value: goalType === "target-years" ? targetYears : targetSavings,
      });
      setSuggestion(result);
      setIsCalculating(false);
    }, 0);
  }

  const periodLabel = mortgage.periodsPerYear === 12 ? "mo" : "2wk";

  return (
    <div className="space-y-8">
      {/* Goal input */}
      <div className="rounded-2xl bg-card shadow-card p-6">
        <h3 className="font-semibold mb-4">Set your paydown goal</h3>

        {/* Goal type toggle */}
        <div className="flex gap-2 mb-6">
          {(["target-years", "target-interest-savings"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setGoalType(type); setSuggestion(null); }}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border",
                goalType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              )}
            >
              {type === "target-years" ? "Pay off by year" : "Save on interest"}
            </button>
          ))}
        </div>

        {goalType === "target-years" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target payoff</span>
              <span className="font-semibold">{targetYears} years</span>
            </div>
            <Slider
              min={1}
              max={mortgage.amortizationYears - 1}
              step={1}
              value={[targetYears]}
              onValueChange={([v]) => { setTargetYears(v); setSuggestion(null); }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 year</span>
              <span>{mortgage.amortizationYears - 1} years</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interest to save</span>
              <span className="font-semibold">{fmt(targetSavings)}</span>
            </div>
            <Slider
              min={1000}
              max={Math.round(mortgage.totalInterest * 0.9 / 1000) * 1000}
              step={1000}
              value={[targetSavings]}
              onValueChange={([v]) => { setTargetSavings(v); setSuggestion(null); }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1,000</span>
              <span>{fmt(Math.round(mortgage.totalInterest * 0.9 / 1000) * 1000)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full mt-5"
        >
          {isCalculating ? "Calculating…" : "Calculate suggestions"}
        </Button>
      </div>

      {/* Suggestion results */}
      {suggestion && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">To {suggestion.targetDescription.toLowerCase()}</h3>
            <p className="text-sm text-muted-foreground">Three ways to reach your goal:</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {suggestion.scenarios.map((scenario, i) => (
              <ScenarioCard key={i} scenario={scenario} isTarget={i === 0} />
            ))}
          </div>
          {suggestion.lumpSumOnlyAmount !== null && suggestion.lumpSumOnlyAmount > 0 && (
            <p className="text-sm text-muted-foreground bg-muted/60 rounded-xl px-4 py-3">
              Lump sum only: <strong>{fmt(suggestion.lumpSumOnlyAmount)}/year</strong> ·{" "}
              Payment increase only: <strong>+{fmt(suggestion.paymentIncreaseOnly ?? 0)}/{periodLabel}</strong>
            </p>
          )}
        </div>
      )}

      {/* Always-on comparison table */}
      <div className="rounded-2xl bg-card shadow-card p-6">
        <h3 className="font-semibold mb-1">Prepayment comparison</h3>
        <p className="text-sm text-muted-foreground mb-4">Annual lump sum scenarios</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {comparisonScenarios.map((scenario) => (
            <div key={scenario.label} className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium mb-2">{scenario.label}</p>
              <p className="text-xs text-muted-foreground">Interest saved</p>
              <p className="font-semibold text-primary result-number">{fmt(scenario.interestSaved)}</p>
              <p className="text-xs text-muted-foreground mt-2">Time saved</p>
              <p className="font-medium result-number text-sm">
                {scenario.timeSavedYears > 0 || scenario.timeSavedMonths > 0
                  ? `${scenario.timeSavedYears > 0 ? `${scenario.timeSavedYears}y ` : ""}${scenario.timeSavedMonths > 0 ? `${scenario.timeSavedMonths}m` : ""}`
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
