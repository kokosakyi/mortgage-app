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

// ── Draft (auto-save working state) ──────────────────────────────────────────

const DRAFT_KEY = "mortgage_app_draft";

interface MortgageDraft {
  version: 1;
  inputs: MortgageInput;
  lumpSums: LumpSum[];
  startDate: string;
}

export function saveDraft(
  inputs: MortgageInput,
  lumpSums: LumpSum[],
  startDate: Date
): void {
  if (typeof window === "undefined") return;
  try {
    const draft: MortgageDraft = {
      version: 1,
      inputs,
      lumpSums,
      startDate: startDate.toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage quota exceeded — swallow silently
  }
}

export function loadDraft(): {
  inputs: MortgageInput;
  lumpSums: LumpSum[];
  startDate: Date;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as MortgageDraft;
    if (parsed.version !== 1) { clearDraft(); return null; }
    if (!parsed.inputs || !Array.isArray(parsed.lumpSums) || !parsed.startDate) return null;
    const date = new Date(parsed.startDate);
    if (isNaN(date.getTime())) return null;
    return { inputs: parsed.inputs, lumpSums: parsed.lumpSums, startDate: date };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
