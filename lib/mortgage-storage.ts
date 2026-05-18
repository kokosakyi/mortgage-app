import type { MortgageResult, MortgageInput, LumpSum } from "./mortgage-calculator";

export interface SavedMortgage extends MortgageResult {
  id: string;
  savedAt: string;
  inputs: MortgageInput;
  lumpSums: LumpSum[];
  scheduleStartDate: string;
}

const STORAGE_KEY = "mortgage_app_saved_mortgage";

export function saveMortgage(
  mortgage: MortgageResult,
  inputs: MortgageInput,
  lumpSums: LumpSum[],
  scheduleStartDate: Date
): SavedMortgage {
  const savedMortgage: SavedMortgage = {
    ...mortgage,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    inputs,
    lumpSums,
    scheduleStartDate: scheduleStartDate.toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMortgage));
  return savedMortgage;
}

export function getSavedMortgage(): SavedMortgage | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SavedMortgage;
  } catch {
    return null;
  }
}

export function deleteSavedMortgage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedMortgage(): boolean {
  return getSavedMortgage() !== null;
}
