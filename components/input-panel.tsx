"use client";

import { useState } from "react";
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
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  const [downMode, setDownMode] = useState<"percent" | "amount">("percent");

  const homePrice = inputs.homePrice;
  const downPercent = inputs.downPaymentPercent ?? 20;
  const downAmount = inputs.downPayment ?? (homePrice * downPercent) / 100;

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
      <div className="space-y-2">
        <Label htmlFor="homePrice" className="text-sm font-medium">Home price</Label>
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
      </div>

      {/* Down payment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Down payment</Label>
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
        </div>
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
              = {new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format((homePrice * downPercent) / 100)}
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
      </div>

      {/* Interest rate */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Interest rate</Label>
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
      </div>

      {/* Amortization */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Amortization period</Label>
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
      </div>

      {/* Payment frequency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Payment frequency</Label>
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
      </div>
    </div>
  );
}
