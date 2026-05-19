"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Calculator", icon: LineChart },
  { href: "/dashboard", label: "Saved", icon: Home },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <span className="text-primary-foreground font-bold text-sm tracking-tight">M</span>
          </div>
          <span className="font-display font-semibold tracking-tight text-base hidden sm:inline">
            Mortgage
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-muted/60 p-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
