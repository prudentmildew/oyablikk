// The canonical schedule shape (ADR-0004): the on-disk data/schedule.json
// matches these types 1:1, so the app needs no hydration step.

export type Stage = {
  id: string;
  name: string;
  color: string;
  textColor: string;
};

export type Act = {
  /** Stable act identity: the Sanity artist `_id`, verbatim (ADR-0004). */
  id: string;
  name: string;
  /** "HH:MM" Oslo wall-clock time. */
  start: string;
  end: string;
  start_min: number;
  end_min: number;
};

export type Day = {
  /** ISO date, e.g. "2026-08-12". */
  date: string;
  /** Envelope of the day's programme, minutes since midnight. */
  start_min: number;
  end_min: number;
  /** Acts per stage id. Every configured stage is present, possibly empty. */
  acts: Record<string, Act[]>;
};

export type Schedule = {
  stages: Stage[];
  days: Day[];
};
