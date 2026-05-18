import { CalculatorForm } from "@/components/calculator-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
            Canadian Mortgage Calculator
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Know your numbers.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Calculate payments, plan your paydown strategy, and see your full amortization schedule — all in your browser.
          </p>
        </div>
        <CalculatorForm />
      </div>
    </main>
  );
}
