"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

  useEffect(() => {
    setSavedMortgage(getSavedMortgage());
  }, []);

  function handleDelete() {
    if (confirm("Are you sure you want to delete this saved mortgage?")) {
      deleteSavedMortgage();
      setSavedMortgage(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Saved mortgage</h1>
          </div>
          <Link href="/">
            <Button variant="outline">Back to calculator</Button>
          </Link>
        </div>

        {savedMortgage ? (
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
                <div className="rounded-xl bg-primary/8 p-5">
                  <p className="text-sm text-muted-foreground mb-1">Payment</p>
                  <p className="text-4xl font-bold text-primary result-number">
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
                    <div key={label} className="flex justify-between py-2.5 border-b border-border last:border-0 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={handleDelete} variant="destructive" size="sm" className="w-full">
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
                  <div key={label} className="flex justify-between py-2.5 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-semibold result-number">{value}</span>
                  </div>
                ))}

                {savedMortgage.lumpSums.length > 0 && (
                  <div className="rounded-xl bg-accent/40 px-4 py-3">
                    <p className="text-sm font-medium text-accent-foreground">
                      {savedMortgage.lumpSums.length} lump sum payment{savedMortgage.lumpSums.length > 1 ? "s" : ""} saved
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open the calculator to view the amortization schedule with prepayments.
                    </p>
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
    </div>
  );
}
