"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AmortizationSchedule } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short" }).format(d);

interface AmortizationTableProps {
  schedule: AmortizationSchedule;
  baselinePayoffPeriod?: number;
  periodsPerYear: number;
  pageSize?: number;
}

function periodsToYearsMonths(periods: number, periodsPerYear: number) {
  const totalMonths = Math.round((periods / periodsPerYear) * 12);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

export function AmortizationTable({ schedule, baselinePayoffPeriod, periodsPerYear, pageSize = 24 }: AmortizationTableProps) {
  const [page, setPage] = useState(0);
  const { rows } = schedule;
  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const { years: payoffYears, months: payoffMonths } = periodsToYearsMonths(
    schedule.actualPayoffPeriod,
    periodsPerYear
  );
  const { years: savedYears, months: savedMonths } = periodsToYearsMonths(
    schedule.periodsSaved,
    periodsPerYear
  );

  return (
    <div className="rounded-2xl bg-card shadow-card overflow-hidden">
      {/* Summary bar — horizontal scroll on mobile if needed */}
      <div className="px-4 sm:px-6 py-4 border-b border-border grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Payoff in</p>
          <p className="font-semibold result-number">
            {payoffYears > 0 && `${payoffYears}y `}{payoffMonths > 0 && `${payoffMonths}m`}
            {payoffYears === 0 && payoffMonths === 0 && "—"}
          </p>
        </div>
        {schedule.interestSaved > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Interest saved</p>
            <p className="font-semibold text-primary result-number">{fmt(schedule.interestSaved)}</p>
          </div>
        )}
        {schedule.periodsSaved > 0 && baselinePayoffPeriod && (
          <div>
            <p className="text-xs text-muted-foreground">Time saved</p>
            <p className="font-semibold text-primary result-number">
              {savedYears > 0 && `${savedYears}y `}{savedMonths > 0 && `${savedMonths}m`}
              {savedYears === 0 && savedMonths === 0 && "—"}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Total interest</p>
          <p className="font-semibold result-number">{fmt(schedule.totalInterestPaid)}</p>
        </div>
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Lump sum</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={row.paymentNumber}
                className={cn(row.lumpSum > 0 && "bg-accent/40 hover:bg-accent/60")}
              >
                <TableCell className="text-muted-foreground text-xs">{row.paymentNumber}</TableCell>
                <TableCell className="text-sm">{fmtDate(row.date)}</TableCell>
                <TableCell className="text-right result-number text-sm">{fmt(row.paymentAmount)}</TableCell>
                <TableCell className="text-right result-number text-sm text-primary">{fmt(row.principalPortion)}</TableCell>
                <TableCell className="text-right result-number text-sm text-muted-foreground">{fmt(row.interestPortion)}</TableCell>
                <TableCell className="text-right result-number text-sm">
                  {row.lumpSum > 0 ? (
                    <span className="font-medium text-primary">{fmt(row.lumpSum)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right result-number text-sm font-medium">{fmt(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked card rows */}
      <ul className="sm:hidden divide-y divide-border">
        {pageRows.map((row) => (
          <li
            key={row.paymentNumber}
            className={cn(
              "px-4 py-3 transition-colors",
              row.lumpSum > 0 && "bg-accent/40"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground tabular-nums">#{row.paymentNumber}</span>
                <span className="text-foreground font-medium">{fmtDate(row.date)}</span>
                {row.lumpSum > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-medium">
                    <Sparkles className="w-2.5 h-2.5" />
                    {fmt(row.lumpSum)}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold result-number">{fmt(row.balance)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium result-number">{fmt(row.paymentAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Principal</p>
                <p className="font-medium text-primary result-number">{fmt(row.principalPortion)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest</p>
                <p className="font-medium text-muted-foreground result-number">{fmt(row.interestPortion)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
