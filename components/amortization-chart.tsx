"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AmortizationSchedule, PaymentFrequency } from "@/lib/mortgage-calculator";

function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function fmtFull(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

type SampledRow = {
  year: number;
  balance: number;
  annualInterest: number;
  annualPrincipal: number;
};

function sampleByYear(
  rows: AmortizationSchedule["rows"],
  periodsPerYear: number
): SampledRow[] {
  const result: SampledRow[] = [];

  for (let i = 0; i < rows.length; i += periodsPerYear) {
    const yearSlice = rows.slice(i, Math.min(i + periodsPerYear, rows.length));
    const row = rows[i];
    result.push({
      year: Math.round(row.paymentNumber / periodsPerYear),
      balance: row.balance,
      annualInterest: yearSlice.reduce((s, r) => s + r.interestPortion, 0),
      annualPrincipal: yearSlice.reduce((s, r) => s + r.principalPortion + r.lumpSum, 0),
    });
  }

  const last = rows[rows.length - 1];
  if (last) {
    const lastYear = Math.ceil(last.paymentNumber / periodsPerYear);
    if (result[result.length - 1]?.year !== lastYear) {
      result.push({ year: lastYear, balance: 0, annualInterest: 0, annualPrincipal: 0 });
    }
  }

  return result;
}

type ChartView = "balance" | "payments";

interface AmortizationChartProps {
  baseline: AmortizationSchedule;
  accelerated: AmortizationSchedule | null;
  frequency: PaymentFrequency;
}

export function AmortizationChart({ baseline, accelerated, frequency }: AmortizationChartProps) {
  const [view, setView] = useState<ChartView>("balance");

  const periodsPerYear = frequency === "monthly" ? 12 : 26;
  const baselineSampled = sampleByYear(baseline.rows, periodsPerYear);
  const acceleratedSampled = accelerated ? sampleByYear(accelerated.rows, periodsPerYear) : null;

  const maxYear = Math.max(
    baselineSampled[baselineSampled.length - 1]?.year ?? 0,
    acceleratedSampled?.[acceleratedSampled.length - 1]?.year ?? 0
  );

  // Crossover year: first year where baseline principal >= baseline interest
  const crossoverYear = baselineSampled.find(
    (r) => r.annualPrincipal >= r.annualInterest
  )?.year ?? null;

  type DataPoint = {
    year: number;
    original?: number;
    withPrepayments?: number;
    baselineInterest?: number;
    baselinePrincipal?: number;
    accelInterest?: number;
  };

  const data: DataPoint[] = [];
  for (let yr = 0; yr <= maxYear; yr++) {
    const baseRow = baselineSampled.find((r) => r.year === yr);
    const accelRow = acceleratedSampled?.find((r) => r.year === yr);
    data.push({
      year: yr,
      // balance view
      original: baseRow?.balance,
      ...(acceleratedSampled
        ? {
            withPrepayments:
              accelRow?.balance ??
              (yr > (acceleratedSampled[acceleratedSampled.length - 1]?.year ?? 0) ? 0 : undefined),
          }
        : {}),
      // payments view
      baselineInterest: baseRow?.annualInterest,
      baselinePrincipal: baseRow?.annualPrincipal,
      ...(acceleratedSampled ? { accelInterest: accelRow?.annualInterest } : {}),
    });
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "none",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 20px 0 rgb(0 0 0 / 0.09)",
    fontSize: 13,
  };

  return (
    <div className="rounded-2xl bg-card shadow-card p-6 mb-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <div>
          <h3 className="font-semibold">
            {view === "balance" ? "Balance over time" : "Annual payment breakdown"}
          </h3>
          {accelerated && view === "balance" && (
            <p className="text-sm text-muted-foreground mt-1">
              Prepayments save{" "}
              <span className="font-medium text-primary">{fmtFull(accelerated.interestSaved)}</span>{" "}
              in interest and pay off{" "}
              {Math.floor(accelerated.periodsSaved / periodsPerYear)} years{" "}
              {Math.round((accelerated.periodsSaved % periodsPerYear) * (12 / periodsPerYear))} months early.
            </p>
          )}
          {view === "payments" && crossoverYear !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              Your principal payment overtakes interest at{" "}
              <span className="font-medium text-primary">year {crossoverYear}</span>.
            </p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden border border-input text-xs shrink-0">
          {(["balance", "payments"] as ChartView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 transition-colors capitalize",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {v === "balance" ? "Balance" : "Payments"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `Yr ${v}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={fmtShort}
            width={60}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number" ? fmtFull(value) : value,
              name,
            ]}
            contentStyle={tooltipStyle}
          />
          <Legend iconType="circle" iconSize={8} />

          {view === "balance" ? (
            <>
              <Line
                type="monotone"
                dataKey="original"
                name="Original"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              {acceleratedSampled && (
                <Line
                  type="monotone"
                  dataKey="withPrepayments"
                  name="With prepayments"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                />
              )}
            </>
          ) : (
            <>
              {crossoverYear !== null && (
                <ReferenceLine
                  x={crossoverYear}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{
                    value: "Crossover",
                    position: "top",
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="baselineInterest"
                name="Interest paid / yr"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="baselinePrincipal"
                name="Principal paid / yr"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              {acceleratedSampled && (
                <Line
                  type="monotone"
                  dataKey="accelInterest"
                  name="Interest paid / yr (w/ prepayments)"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  connectNulls
                />
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
