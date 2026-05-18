"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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

function sampleByYear(rows: AmortizationSchedule["rows"], periodsPerYear: number) {
  const result: Array<{ year: number; balance: number }> = [];
  for (let i = 0; i < rows.length; i += periodsPerYear) {
    const row = rows[i];
    result.push({
      year: Math.round(row.paymentNumber / periodsPerYear),
      balance: row.balance,
    });
  }
  // Always include the final row
  const last = rows[rows.length - 1];
  if (last && result[result.length - 1]?.year !== Math.ceil(last.paymentNumber / periodsPerYear)) {
    result.push({
      year: Math.ceil(last.paymentNumber / periodsPerYear),
      balance: 0,
    });
  }
  return result;
}

interface AmortizationChartProps {
  baseline: AmortizationSchedule;
  accelerated: AmortizationSchedule | null;
  frequency: PaymentFrequency;
}

export function AmortizationChart({ baseline, accelerated, frequency }: AmortizationChartProps) {
  const periodsPerYear = frequency === "monthly" ? 12 : 26;
  const baselineSampled = sampleByYear(baseline.rows, periodsPerYear);
  const acceleratedSampled = accelerated ? sampleByYear(accelerated.rows, periodsPerYear) : null;

  // Merge into one data array keyed by year
  const maxYear = Math.max(
    baselineSampled[baselineSampled.length - 1]?.year ?? 0,
    acceleratedSampled?.[acceleratedSampled.length - 1]?.year ?? 0
  );

  const data: Array<{ year: number; original?: number; withPrepayments?: number }> = [];
  for (let yr = 0; yr <= maxYear; yr++) {
    const baseRow = baselineSampled.find((r) => r.year === yr);
    const accelRow = acceleratedSampled?.find((r) => r.year === yr);
    data.push({
      year: yr,
      original: baseRow?.balance,
      ...(acceleratedSampled ? { withPrepayments: accelRow?.balance ?? (yr > (acceleratedSampled[acceleratedSampled.length - 1]?.year ?? 0) ? 0 : undefined) } : {}),
    });
  }

  return (
    <div className="rounded-2xl bg-card shadow-card p-6 mb-6">
      <h3 className="font-semibold mb-1">Balance over time</h3>
      {accelerated && (
        <p className="text-sm text-muted-foreground mb-4">
          Prepayments save{" "}
          <span className="font-medium text-primary">
            {fmtFull(accelerated.interestSaved)}
          </span>{" "}
          in interest and pay off {Math.floor(accelerated.periodsSaved / periodsPerYear)} years{" "}
          {Math.round((accelerated.periodsSaved % periodsPerYear) * (12 / periodsPerYear))} months early.
        </p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            formatter={(value, name) => [typeof value === "number" ? fmtFull(value) : value, name]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "none",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 20px 0 rgb(0 0 0 / 0.09)",
              fontSize: 13,
            }}
          />
          {acceleratedSampled && <Legend iconType="circle" iconSize={8} />}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
