"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mortgage_app_theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-card text-muted-foreground transition-all hover:text-foreground hover:border-foreground/20 hover:bg-muted active:scale-95",
        className
      )}
    >
      {/* Render both, swap with opacity to avoid hydration mismatch */}
      <Sun
        className={cn(
          "h-4 w-4 absolute transition-all duration-300",
          mounted && theme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 absolute transition-all duration-300",
          mounted && theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
        )}
      />
    </button>
  );
}
