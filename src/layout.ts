import type { Schedule } from "./schedule.ts";

export type TimeOrigin = {
  startMin: number;
  endMin: number;
};

export function sharedOrigin(schedule: Schedule): TimeOrigin {
  let startMin = Number.POSITIVE_INFINITY;
  let endMin = Number.NEGATIVE_INFINITY;
  for (const day of schedule.days) {
    if (day.start_min < startMin) startMin = day.start_min;
    if (day.end_min > endMin) endMin = day.end_min;
  }
  return { startMin, endMin };
}

export function pxFromMin(min: number, origin: TimeOrigin, pxPerMinute: number): number {
  return (min - origin.startMin) * pxPerMinute;
}
