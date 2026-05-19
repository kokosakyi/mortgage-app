"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Bookmark, Trash2, Sparkles } from "lucide-react";
import { getSavedMortgage, deleteSavedMortgage, type SavedMortgage } from "@/lib/mortgage-storage";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "per month",
  biweekly: "every 2 weeks",
  "accelerated-biweekly": "every 2 weeks (accelerated)",
};

export default function DashboardPage() {
  const [savedMortgage, setSavedMortgage] = useState<SavedMortgage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSavedMortgage(getSavedMortgage());
    setMounted(true);
  }, []);

  function handleDelete() {
    if (confirm("Are you sure you want to delete this saved mortgage?")) {
      deleteSavedMortgage();
      setSavedMortgage(null);
    }
  }

  return (
    <main className="min-h-screen bg-mesh">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16 pb-20">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8 md:mb-10 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Bookmark className="w-3 h-3" />
              Dashboard
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Saved mortgage
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4" />
              Back to calculator
            </Button>
          </Link>
        </div>

        {!mounted ? null : savedMortgage ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Saved {new Date(savedMortgage.savedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-5 overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payment</p>
                  </div>
                  <p className="text-4xl sm:text-5xl font-bold font-display text-foreground result-number tracking-tight">
                    {fmt(savedMortgage.paymentAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {FREQUENCY_LABELS[savedMortgage.paymentFrequency]}
                  </p>
                </div>

                <div className="space-y-0">
                  {[
                    ["Principal", fmt(savedMortgage.principalAmount)],
                    ["Down payment", `${fmt(savedMortgage.downPayment)} (${savedMortgage.downPaymentPercent.toFixed(1)}%)`],
                    ["Interest rate", `${savedMortgage.interestRate}%`],
                    ["Amortization", `${savedMortgage.amortizationYears} years`],
                    ["Total loan", fmt(savedMortgage.totalLoanAmount)],
                    ...(savedMortgage.cmhcInsurance > 0 ? [["CMHC insurance", fmt(savedMortgage.cmhcInsurance)]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-border/70 last:border-0 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium result-number">{value}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={handleDelete} variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                  <Trash2 className="w-4 h-4" />
                  Delete saved mortgage
                </Button>
              </CardContent>
            </Card>

            {/* Payment summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
                <CardDescription>Total costs over the full amortization period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  ["Total payments", savedMortgage.totalPayments.toLocaleString()],
                  ["Total interest", fmt(savedMortgage.totalInterest)],
                  ["Total amount paid", fmt(savedMortgage.totalAmountPaid)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5 border-b border-border/70 last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-semibold result-number">{value}</span>
                  </div>
                ))}

                {savedMortgage.lumpSums.length > 0 && (
                  <div className="rounded-xl bg-accent/60 border border-border/50 px-4 py-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-accent-foreground">
                        {savedMortgage.lumpSums.length} lump sum payment{savedMortgage.lumpSums.length > 1 ? "s" : ""} saved
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Open the calculator to view the amortization schedule with prepayments.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      View amortization schedule
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No mortgage saved</CardTitle>
              <CardDescription>Use the calculator to calculate and save your mortgage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button size="lg">Go to calculator</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
