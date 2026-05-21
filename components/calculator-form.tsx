"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateMortgage, type MortgageInput, type MortgageResult, type LumpSum } from "@/lib/mortgage-calculator";
import { generateComparisonSchedules } from "@/lib/amortization-schedule";
import { saveMortgage, loadDraft, saveDraft } from "@/lib/mortgage-storage";
import { Calculator, TrendingDown, Target } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentHero } from "@/components/payment-hero";
import { InputPanel } from "@/components/input-panel";
import { ResultsPanel } from "@/components/results-panel";
import { LumpSumManager } from "@/components/lump-sum-manager";
import { AmortizationChart } from "@/components/amortization-chart";
import { AmortizationTable } from "@/components/amortization-table";
import { PaydownPlanner } from "@/components/paydown-planner";
import { BottomNav, type CalcTab } from "@/components/bottom-nav";
import { ExtraPaymentControl } from "@/components/extra-payment-control";

const DEFAULT_INPUTS: MortgageInput = {
  homePrice: 500000,
  downPayment: null,
  downPaymentPercent: 20,
  interestRate: 5.5,
  amortizationYears: 25,
  paymentFrequency: "monthly",
};

function firstOfNextMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalculatorForm() {
  const router = useRouter();
  const [{ inputs: _i, lumpSums: _ls, startDate: _sd, extraPayment: _ep }] = useState(() => {
    const draft = loadDraft();
    return {
      inputs: draft?.inputs ?? DEFAULT_INPUTS,
      lumpSums: draft?.lumpSums ?? [],
      startDate: draft?.startDate ?? firstOfNextMonth(),
      extraPayment: draft?.extraPayment ?? 0,
    };
  });

  const [inputs, setInputs] = useState<MortgageInput>(_i);
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [lumpSums, setLumpSums] = useState<LumpSum[]>(_ls);
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date>(_sd);
  const [extraPayment, setExtraPayment] = useState<number>(_ep);
  const [tab, setTab] = useState<CalcTab>("calculator");

  useEffect(() => {
    try {
      setResult(calculateMortgage(inputs));
    } catch {
      setResult(null);
    }
  }, [inputs]);

  useEffect(() => {
    saveDraft(inputs, lumpSums, startDate, extraPayment);
  }, [inputs, lumpSums, startDate, extraPayment]);

  const scheduleData = useMemo(() => {
    if (!result) return null;
    return generateComparisonSchedules(result, lumpSums, startDate, extraPayment);
  }, [result, lumpSums, startDate, extraPayment]);

  function handleInputChange(updates: Partial<MortgageInput>) {
    setInputs((prev) => ({ ...prev, ...updates }));
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    saveMortgage(result, inputs, lumpSums, startDate);
    router.push("/dashboard");
    setIsSaving(false);
  }

  return (
    <div>
      {result && <PaymentHero result={result} />}

      <Tabs value={tab} onValueChange={(v) => setTab(v as CalcTab)}>
        {/* Desktop tabs — hidden on mobile (replaced by BottomNav) */}
        <TabsList className="hidden md:inline-flex mb-6 h-11 p-1 rounded-full bg-muted/60 border border-border/60">
          <TabsTrigger
            value="calculator"
            className="gap-1.5 rounded-full px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />Calculator
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="gap-1.5 rounded-full px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <TrendingDown className="w-3.5 h-3.5" />Amortization
          </TabsTrigger>
          <TabsTrigger
            value="planner"
            className="gap-1.5 rounded-full px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Target className="w-3.5 h-3.5" />Paydown Planner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mortgage details</CardTitle>
              </CardHeader>
              <CardContent>
                <InputPanel
                  inputs={inputs}
                  onChange={handleInputChange}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <ResultsPanel result={result} onSave={handleSave} isSaving={isSaving} startDate={startDate} />
                ) : (
                  <p className="text-muted-foreground text-sm">Enter valid mortgage details to see results.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0 space-y-6">
          {result && scheduleData ? (
            <>
              <ExtraPaymentControl
                mortgage={result}
                extraPayment={extraPayment}
                onChange={setExtraPayment}
              />
              <LumpSumManager
                mortgage={result}
                lumpSums={lumpSums}
                onLumpSumsChange={setLumpSums}
              />
              <AmortizationChart
                baseline={scheduleData.baseline}
                accelerated={lumpSums.length > 0 || extraPayment > 0 ? scheduleData.accelerated : null}
                frequency={result.paymentFrequency}
              />
              <AmortizationTable
                schedule={scheduleData.accelerated}
                baselinePayoffPeriod={scheduleData.baseline.actualPayoffPeriod}
                periodsPerYear={result.periodsPerYear}
              />
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter mortgage details first.</p>
          )}
        </TabsContent>

        <TabsContent value="planner" className="mt-0">
          {result ? (
            <PaydownPlanner mortgage={result} />
          ) : (
            <p className="text-muted-foreground text-sm">Enter mortgage details first.</p>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav value={tab} onChange={setTab} />
    </div>
  );
}
