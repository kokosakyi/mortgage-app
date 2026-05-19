import { CalculatorForm } from "@/components/calculator-form";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-mesh pb-safe-nav">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16">
        <div className="mb-8 md:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Canadian Mortgage Calculator
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 leading-[1.05]">
            Know your numbers.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Calculate payments, plan your paydown strategy, and see your full amortization — all in your browser.
          </p>
        </div>
        <CalculatorForm />
      </div>
    </main>
  );
}
