"use client";

import { useState } from "react";
import { Info, X, CalendarDays, Home, Percent, Clock, Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MortgageInput } from "@/lib/mortgage-calculator";

interface InputPanelProps {
  inputs: MortgageInput;
  onChange: (updates: Partial<MortgageInput>) => void;
  startDate: Date;
  onStartDateChange: (d: Date) => void;
}

// --- FieldWithInfo -----------------------------------------------------------
// Defined at module level so React never unmounts it between InputPanel renders.

interface FieldWithInfoProps {
  label: React.ReactNode;
  tip: string;
  children: React.ReactNode;
  labelRight?: React.ReactNode;
}

function FieldWithInfo({ label, tip, children, labelRight }: FieldWithInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {label}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Hide explanation" : "Show advisor tip"}
            className={cn(
              "flex items-center justify-center w-[18px] h-[18px] rounded-full transition-all duration-200 flex-shrink-0",
              open
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"
            )}
          >
            {open ? <X className="w-2.5 h-2.5" /> : <Info className="w-2.5 h-2.5" />}
          </button>
        </div>
        {labelRight}
      </div>

      {/* Smooth expand / collapse using the CSS grid-rows trick */}
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="mb-2 px-3 py-2.5 rounded-lg bg-accent/60 border-l-[3px] border-primary/50">
            <p className="text-[11.5px] leading-relaxed text-accent-foreground/85 italic">
              {tip}
            </p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

// --- Helpers -----------------------------------------------------------------

function toMonthValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fromMonthValue(v: string): Date {
  const [year, month] = v.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

// --- Advisor tips ------------------------------------------------------------

const TIPS = {
  homePrice:
    "Think of this as the agreed purchase price — the number at the top of your Agreement of Purchase and Sale. Everything else flows from here: your minimum down payment, whether CMHC insurance applies, and how much you'll ultimately borrow.",

  downPayment:
    "Your down payment is the cash you bring to the table on closing day. In Canada you need at least 5% for homes under $500K, and 10% on the portion above that up to $999K. The magic threshold is 20%: cross it and you avoid CMHC mortgage default insurance entirely — which saves you thousands added to your loan balance.",

  interestRate:
    "This is the annual rate your lender charges, but here's a nuance many buyers miss: in Canada, mortgage rates compound semi-annually by law — not monthly like in the US. Even a 0.25% difference in rate on a $400K mortgage can translate to $12,000–$15,000 in extra interest over 25 years. It is always worth negotiating or shopping lenders for even a small rate reduction.",

  amortization:
    "This is the total lifespan of your mortgage — how long until the balance reaches zero if you make every scheduled payment. The most common choice in Canada is 25 years. Shortening it to 20 years bumps your payment up but dramatically reduces total interest paid. Stretching to 30 years lowers your payment but costs you significantly more over the life of the loan.",

  frequency:
    "Monthly is the default — 12 payments a year, clean and simple. Bi-weekly gives you 26 payments. But accelerated bi-weekly is where things get interesting: your payment is exactly half your monthly amount, yet because some months have an extra bi-weekly slot, you effectively squeeze in one extra full payment per year. That extra principal hit can shave years off your amortization with no real lifestyle adjustment.",

  startDate:
    "This is when your first mortgage payment is due. Lenders typically set it to the 1st of the month following your closing date. Setting the correct date here lets you see exactly when each future payment falls and — more motivating — the precise date you will be completely mortgage-free.",
} as const;

// --- Component ---------------------------------------------------------------

export function InputPanel({ inputs, onChange, startDate, onStartDateChange }: InputPanelProps) {
  const [downMode, setDownMode] = useState<"percent" | "amount">("percent");

  const homePrice = inputs.homePrice;
  const downPercent = inputs.downPaymentPercent ?? 20;
  const downAmount = inputs.downPayment ?? (homePrice * downPercent) / 100;

  const minMonth = "2020-01";

  function handleDownModeSwitch(mode: "percent" | "amount") {
    setDownMode(mode);
    if (mode === "percent") {
      const pct = Math.min(100, Math.max(0, (downAmount / homePrice) * 100));
      onChange({ downPayment: null, downPaymentPercent: parseFloat(pct.toFixed(2)) });
    } else {
      const amt = (homePrice * downPercent) / 100;
      onChange({ downPayment: amt, downPaymentPercent: null });
    }
  }

  return (
    <div className="space-y-7">
      {/* Home price */}
      <FieldWithInfo
        label={
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-muted-foreground" />
            <Label htmlFor="homePrice" className="text-sm font-medium">Home price</Label>
          </div>
        }
        tip={TIPS.homePrice}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            id="homePrice"
            type="number"
            className="pl-7"
            value={homePrice}
            onChange={(e) => onChange({ homePrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </FieldWithInfo>

      {/* Down payment */}
      <FieldWithInfo
        label={<Label className="text-sm font-medium">Down payment</Label>}
        tip={TIPS.downPayment}
        labelRight={
          <div className="flex rounded-lg overflow-hidden border border-input text-xs">
            {(["percent", "amount"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleDownModeSwitch(mode)}
                className={cn(
                  "px-3 py-1 transition-colors",
                  downMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                {mode === "percent" ? "%" : "$"}
              </button>
            ))}
          </div>
        }
      >
        {downMode === "percent" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Slider
                min={5}
                max={50}
                step={0.5}
                value={[downPercent]}
                onValueChange={([v]) => onChange({ downPayment: null, downPaymentPercent: v })}
                className="flex-1"
              />
              <div className="relative w-20">
                <Input
                  type="number"
                  className="pr-6 text-right"
                  value={downPercent}
                  min={5}
                  max={100}
                  step={0.5}
                  onChange={(e) =>
                    onChange({ downPayment: null, downPaymentPercent: parseFloat(e.target.value) || 0 })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              = {cad.format((homePrice * downPercent) / 100)}
            </p>
          </div>
        ) : (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              className="pl-7"
              value={downAmount}
              onChange={(e) =>
                onChange({ downPayment: parseFloat(e.target.value) || 0, downPaymentPercent: null })
              }
            />
          </div>
        )}
      </FieldWithInfo>

      {/* Interest rate */}
      <FieldWithInfo
        label={
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-sm font-medium">Interest rate</Label>
          </div>
        }
        tip={TIPS.interestRate}
      >
        <div className="flex items-center gap-3">
          <Slider
            min={0.5}
            max={15}
            step={0.01}
            value={[inputs.interestRate]}
            onValueChange={([v]) => onChange({ interestRate: v })}
            className="flex-1"
          />
          <div className="relative w-20">
            <Input
              type="number"
              className="pr-6 text-right"
              value={inputs.interestRate}
              min={0.1}
              max={25}
              step={0.01}
              onChange={(e) => onChange({ interestRate: parseFloat(e.target.value) || 0 })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        </div>
      </FieldWithInfo>

      {/* Amortization */}
      <FieldWithInfo
        label={
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-sm font-medium">Amortization period</Label>
          </div>
        }
        tip={TIPS.amortization}
      >
        <div className="flex items-center gap-3">
          <Slider
            min={5}
            max={30}
            step={1}
            value={[inputs.amortizationYears]}
            onValueChange={([v]) => onChange({ amortizationYears: v })}
            className="flex-1"
          />
          <div className="w-20 text-right">
            <span className="font-semibold">{inputs.amortizationYears}</span>
            <span className="text-muted-foreground text-sm ml-1">yr</span>
          </div>
        </div>
      </FieldWithInfo>

      {/* Payment frequency */}
      <FieldWithInfo
        label={
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-sm font-medium">Payment frequency</Label>
          </div>
        }
        tip={TIPS.frequency}
      >
        <Select
          value={inputs.paymentFrequency}
          onValueChange={(v) => onChange({ paymentFrequency: v as MortgageInput["paymentFrequency"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="accelerated-biweekly">Accelerated bi-weekly</SelectItem>
          </SelectContent>
        </Select>
      </FieldWithInfo>

      {/* Mortgage start date */}
      <FieldWithInfo
        label={
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-sm font-medium">Mortgage start date</Label>
          </div>
        }
        tip={TIPS.startDate}
      >
        <Input
          type="month"
          value={toMonthValue(startDate)}
          min={minMonth}
          onChange={(e) => {
            if (e.target.value) onStartDateChange(fromMonthValue(e.target.value));
          }}
          className="w-full"
        />
      </FieldWithInfo>
    </div>
  );
}
