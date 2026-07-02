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
