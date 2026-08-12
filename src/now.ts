const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Oslo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function osloDate(now: Date): string {
  return dateFormatter.format(now);
}

export function osloMinutes(now: Date): number {
  const parts = timeFormatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  return (hour % 24) * 60 + minute;
}

export function todayFestivalDate(festivalDates: string[], now: Date): string | null {
  const today = osloDate(now);
  return festivalDates.find((d) => d === today) ?? null;
}

/** A Day's relation to the real-world Oslo date (ADR-0022). */
export type DayStanding = "past" | "today" | "future";

/**
 * Day standing plus the dormant state: `"none"` means no pane is today, which
 * is the case for all but the five festival days (ADR-0022).
 */
export type ScheduleStanding = DayStanding | "none";

/**
 * Where a Day sits relative to today in Oslo. ISO dates sort lexicographically
 * in calendar order, so a string compare is the whole comparison — no Date
 * parsing, no timezone to get wrong twice.
 */
export function dayStanding(dayDate: string, now: Date): DayStanding {
  const today = osloDate(now);
  if (dayDate === today) return "today";
  return dayDate < today ? "past" : "future";
}
