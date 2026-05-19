"use client";

import { Calculator, TrendingDown, Target, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalcTab = "calculator" | "schedule" | "planner";

const TABS: { value: CalcTab; label: string; icon: LucideIcon }[] = [
  { value: "calculator", label: "Calculate", icon: Calculator },
  { value: "schedule", label: "Schedule", icon: TrendingDown },
  { value: "planner", label: "Plan", icon: Target },
];

interface BottomNavProps {
  value: CalcTab;
  onChange: (value: CalcTab) => void;
}

export function BottomNav({ value, onChange }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around max-w-md mx-auto px-2">
        {TABS.map(({ value: v, label, icon: Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all",
                  active ? "bg-primary/12" : ""
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
              </div>
              <span className={cn("text-[10.5px] font-medium tracking-tight", active && "text-primary")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
