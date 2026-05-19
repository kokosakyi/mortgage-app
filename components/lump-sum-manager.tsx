"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MortgageResult, LumpSum } from "@/lib/mortgage-calculator";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

interface LumpSumManagerProps {
  mortgage: MortgageResult;
  lumpSums: LumpSum[];
  onLumpSumsChange: (lumpSums: LumpSum[]) => void;
}

export function LumpSumManager({ mortgage, lumpSums, onLumpSumsChange }: LumpSumManagerProps) {
  const [open, setOpen] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState("12");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  function handleAdd() {
    const pn = parseInt(paymentNumber, 10);
    const amt = parseFloat(amount);
    if (!pn || !amt || pn < 1 || pn > mortgage.totalPayments) return;

    const newLumpSum: LumpSum = { paymentNumber: pn, amount: amt };
    if (label.trim()) newLumpSum.label = label.trim();

    const updated = [...lumpSums, newLumpSum].sort((a, b) => a.paymentNumber - b.paymentNumber);
    onLumpSumsChange(updated);
    setAmount("");
    setLabel("");
    setOpen(false);
  }

  function handleDelete(index: number) {
    onLumpSumsChange(lumpSums.filter((_, i) => i !== index));
  }

  const frequencyLabel = mortgage.periodsPerYear === 12 ? "month" : "biweekly period";

  return (
    <div className="rounded-2xl bg-card shadow-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-base sm:text-lg">Lump sum prepayments</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Add extra principal payments to see how they shorten your mortgage.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add lump sum</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add lump sum payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Payment {frequencyLabel} number</Label>
                <Input
                  type="number"
                  min={1}
                  max={mortgage.totalPayments}
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  placeholder={`1 – ${mortgage.totalPayments}`}
                />
                <p className="text-xs text-muted-foreground">
                  Payment 1 = first payment, {mortgage.totalPayments} = last scheduled payment
                </p>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    className="pl-7"
                    placeholder="e.g. 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="e.g. Tax refund, bonus"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="w-full">Add payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lumpSums.length > 0 ? (
        <div className="space-y-2">
          {lumpSums.map((ls, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-accent/60 border border-border/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold result-number">{fmt(ls.amount)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  At {frequencyLabel} {ls.paymentNumber}
                  {ls.label ? ` · ${ls.label}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(i)}
                aria-label="Remove lump sum"
                className="text-muted-foreground hover:text-destructive transition-colors p-2 -mr-2 rounded-lg hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No prepayments yet.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add one to see how it accelerates your paydown.</p>
        </div>
      )}
    </div>
  );
}
