"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateMortgage, type MortgageInput, type MortgageResult, type LumpSum } from "@/lib/mortgage-calculator";
import { generateComparisonSchedules } from "@/lib/amortization-schedule";
import { saveMortgage } from "@/lib/mortgage-storage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentHero } from "@/components/payment-hero";
import { InputPanel } from "@/components/input-panel";
import { ResultsPanel } from "@/components/results-panel";
import { LumpSumManager } from "@/components/lump-sum-manager";
import { AmortizationChart } from "@/components/amortization-chart";
import { AmortizationTable } from "@/components/amortization-table";
import { PaydownPlanner } from "@/components/paydown-planner";

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
  const [inputs, setInputs] = useState<MortgageInput>(DEFAULT_INPUTS);
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [lumpSums, setLumpSums] = useState<LumpSum[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [startDate] = useState<Date>(firstOfNextMonth);

  useEffect(() => {
    try {
      setResult(calculateMortgage(inputs));
    } catch {
      setResult(null);
    }
  }, [inputs]);

  const scheduleData = useMemo(() => {
    if (!result) return null;
    return generateComparisonSchedules(result, lumpSums, startDate);
  }, [result, lumpSums, startDate]);

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

      <Tabs defaultValue="calculator">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="schedule">Amortization</TabsTrigger>
          <TabsTrigger value="planner">Paydown Planner</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mortgage details</CardTitle>
              </CardHeader>
              <CardContent>
                <InputPanel inputs={inputs} onChange={handleInputChange} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <ResultsPanel result={result} onSave={handleSave} isSaving={isSaving} />
                ) : (
                  <p className="text-muted-foreground text-sm">Enter valid mortgage details to see results.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          {result && scheduleData ? (
            <>
              <LumpSumManager
                mortgage={result}
                lumpSums={lumpSums}
                onLumpSumsChange={setLumpSums}
              />
              <AmortizationChart
                baseline={scheduleData.baseline}
                accelerated={lumpSums.length > 0 ? scheduleData.accelerated : null}
                frequency={result.paymentFrequency}
              />
              <AmortizationTable
                schedule={scheduleData.accelerated}
                baselinePayoffPeriod={scheduleData.baseline.actualPayoffPeriod}
              />
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter mortgage details first.</p>
          )}
        </TabsContent>

        <TabsContent value="planner">
          {result ? (
            <PaydownPlanner mortgage={result} />
          ) : (
            <p className="text-muted-foreground text-sm">Enter mortgage details first.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
