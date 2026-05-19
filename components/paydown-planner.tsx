"use client";

import { useState } from "react";
import { Target, Zap, BarChart3, Star } from "lucide-react";
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

function ScenarioCard({
  scenario,
  isTarget,
}: {
  scenario: PaydownScenario;
  isTarget?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 border transition-all flex flex-col gap-3",
        isTarget
          ? "border-primary bg-primary/5 shadow-card"
          : "border-border bg-card shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{scenario.label}</p>
        {isTarget && (
          <Badge variant="default" className="shrink-0 text-xs gap-1">
            <Star className="w-2.5 h-2.5" />
            Recommended
          </Badge>
        )}
      </div>

      {/* Human-friendly summary */}
      <p className="text-[11.5px] leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-2">
        {scenario.summary}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-1">
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
            {new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short" }).format(
              scenario.newPayoffDate
            )}
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
  const [goalType, setGoalType] = useState<"target-years" | "target-interest-savings">(
    "target-years"
  );
  const [targetYears, setTargetYears] = useState(Math.max(5, mortgage.amortizationYears - 5));
  const [targetSavings, setTargetSavings] = useState(25000);
  const [suggestion, setSuggestion] = useState<PaydownSuggestion | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const comparisonScenarios = buildComparisonScenarios(mortgage, [0, 2500, 5000, 10000, 15000]);

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Goal input */}
      <div className="rounded-2xl bg-card shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">Set your paydown goal</h3>
        </div>

        <div className="flex gap-1.5 mb-6 p-1 rounded-2xl bg-muted/60 border border-border/60">
          {(["target-years", "target-interest-savings"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setGoalType(type);
                setSuggestion(null);
              }}
              className={cn(
                "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                goalType === type
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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
              onValueChange={([v]) => {
                setTargetYears(v);
                setSuggestion(null);
              }}
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
              max={Math.round((mortgage.totalInterest * 0.9) / 1000) * 1000}
              step={1000}
              value={[targetSavings]}
              onValueChange={([v]) => {
                setTargetSavings(v);
                setSuggestion(null);
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1,000</span>
              <span>{fmt(Math.round((mortgage.totalInterest * 0.9) / 1000) * 1000)}</span>
            </div>
          </div>
        )}

        <Button onClick={handleCalculate} disabled={isCalculating} className="w-full mt-5">
          <Zap className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculating…" : "Calculate suggestions"}
        </Button>
      </div>

      {/* Suggestion results — 5 scenarios */}
      {suggestion && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">
              To {suggestion.targetDescription.toLowerCase()}
            </h3>
            <p className="text-sm text-muted-foreground">
              Five ways to reach your goal — pick the one that fits your cash flow:
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {suggestion.scenarios.map((scenario, i) => (
              // Index 3 = 25% lump + 75% payment: lowest upfront, still meaningful dent
              <ScenarioCard key={i} scenario={scenario} isTarget={i === 3} />
            ))}
          </div>
        </div>
      )}

      {/* Always-on comparison table */}
      <div className="rounded-2xl bg-card shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">Prepayment comparison</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Annual lump sum scenarios — no goal needed
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {comparisonScenarios.map((scenario) => (
            <div key={scenario.label} className="rounded-xl border border-border bg-background/40 p-4 flex flex-col gap-2 transition-all hover:border-foreground/15 hover:bg-background">
              <p className="text-sm font-medium">{scenario.label}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                {scenario.summary}
              </p>
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Interest saved</p>
                <p className="font-semibold text-primary result-number">{fmt(scenario.interestSaved)}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Time saved</p>
                <p className="font-medium result-number text-sm">
                  {scenario.timeSavedYears > 0 || scenario.timeSavedMonths > 0
                    ? `${scenario.timeSavedYears > 0 ? `${scenario.timeSavedYears}y ` : ""}${
                        scenario.timeSavedMonths > 0 ? `${scenario.timeSavedMonths}m` : ""
                      }`
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
