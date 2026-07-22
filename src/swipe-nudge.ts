// First-visit swipe nudge (ADR-0017). A motion hint that the Schedule
// navigates between Days by horizontal swipe. State is client-side only.

const SWIPED_KEY = "oya.hasSwiped"; // set once the user first swipes

// true once the user has genuinely swiped between Days at least once. The
// nudge springs back to the same pane, so it never sets this itself — only a
// real Day change does (see main.ts).
export function hasSwiped(storage: Storage): boolean {
  return storage.getItem(SWIPED_KEY) !== null;
}

export function recordSwiped(storage: Storage): void {
  storage.setItem(SWIPED_KEY, "1");
}

export type NudgeDirection = "forward" | "backward";

// Which neighbouring Day the nudge peeks toward. Forward toward the next Day
// in the common case; on the last Day a forward peek would stall against the
// scroll-snap boundary, so peek backward instead (ADR-0017 §1).
export function nudgeDirection(activeIdx: number, dayCount: number): NudgeDirection {
  return activeIdx === dayCount - 1 ? "backward" : "forward";
}

// Pure gate for whether the nudge plays at all this launch. The install offer
// is perishable (one-shot, hard cutoff) while the hint has unlimited future
// visits, so the nudge yields to the sheet and resumes on the next launch
// where no sheet shows (ADR-0017 §4/§5).
export function shouldPlayNudge(opts: {
  hasSwiped: boolean;
  reducedMotion: boolean;
  installSheetShowing: boolean;
}): boolean {
  return !opts.hasSwiped && !opts.reducedMotion && !opts.installSheetShowing;
}
