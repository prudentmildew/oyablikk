// Stage filter state: which Stages are hidden, persisted in localStorage
// (`oya.*` namespace, PRD §7). The filter is global — a hidden Stage is
// hidden across all Days until re-enabled.
import { DEFAULT_HIDDEN_STAGES } from "../scripts/edition-config.ts";
import type { Stage } from "./schedule.ts";

const STORAGE_KEY = "oya.hiddenStages";

export function loadHiddenStages(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return new Set(DEFAULT_HIDDEN_STAGES);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
      return new Set(parsed);
    }
  } catch {
    // fall through to defaults
  }
  return new Set(DEFAULT_HIDDEN_STAGES);
}

export function saveHiddenStages(hidden: ReadonlySet<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
}

export function visibleStages(stages: Stage[], hidden: ReadonlySet<string>): Stage[] {
  return stages.filter((stage) => !hidden.has(stage.id));
}
