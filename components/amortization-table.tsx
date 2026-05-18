"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  pageSize?: number;
}

export function AmortizationTable({ schedule, baselinePayoffPeriod, pageSize = 24 }: AmortizationTableProps) {
  const [page, setPage] = useState(0);
  const { rows } = schedule;
  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const payoffYears = Math.floor(schedule.actualPayoffPeriod / 12);
  const payoffMonths = schedule.actualPayoffPeriod % 12;

  return (
    <div className="rounded-2xl bg-card shadow-card overflow-hidden">
      {/* Summary bar */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Payoff in</p>
          <p className="font-semibold">
            {payoffYears > 0 && `${payoffYears}y `}{payoffMonths > 0 && `${payoffMonths}m`}
          </p>
        </div>
        {schedule.interestSaved > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Interest saved</p>
            <p className="font-semibold text-primary">{fmt(schedule.interestSaved)}</p>
          </div>
        )}
        {schedule.periodsSaved > 0 && baselinePayoffPeriod && (
          <div>
            <p className="text-xs text-muted-foreground">Time saved</p>
            <p className="font-semibold text-primary">
              {Math.floor(schedule.periodsSaved / 12)}y {schedule.periodsSaved % 12}m
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Total interest</p>
          <p className="font-semibold">{fmt(schedule.totalInterestPaid)}</p>
        </div>
      </div>

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
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
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
