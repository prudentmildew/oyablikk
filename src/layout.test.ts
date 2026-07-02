import { describe, expect, it } from "vitest";
import { pxFromMin, sharedOrigin } from "./layout.ts";
import type { Day, Schedule } from "./schedule.ts";

function makeDay(overrides: Partial<Day> = {}): Day {
  return {
    date: "2026-01-01",
    start_min: 600,
    end_min: 660,
    acts: {},
    ...overrides,
  };
}

describe("sharedOrigin", () => {
  it("spans the earliest start_min and latest end_min across all days", () => {
    const schedule: Schedule = {
      stages: [],
      days: [
        { ...makeDay(), start_min: 840, end_min: 1410 },
        { ...makeDay(), start_min: 750, end_min: 1380 },
        { ...makeDay(), start_min: 780, end_min: 1410 },
      ],
    };
    expect(sharedOrigin(schedule)).toEqual({ startMin: 750, endMin: 1410 });
  });

  it("handles a lone sparse day (the 2026 Tuesday case) inside a wider envelope", () => {
    const schedule: Schedule = {
      stages: [],
      days: [
        { ...makeDay(), start_min: 1290, end_min: 1320 }, // one half-hour act
        { ...makeDay(), start_min: 660, end_min: 1380 },
      ],
    };
    expect(sharedOrigin(schedule)).toEqual({ startMin: 660, endMin: 1380 });
  });
});

describe("pxFromMin", () => {
  it("returns 0 at the origin start", () => {
    expect(pxFromMin(600, { startMin: 600, endMin: 720 }, 2)).toBe(0);
  });

  it("returns (min − origin.startMin) × pxPerMinute", () => {
    expect(pxFromMin(645, { startMin: 600, endMin: 720 }, 2)).toBe(90);
  });

  it("positions a value before the origin as a negative offset", () => {
    // Not used in practice (caller clamps), but the formula is unconditional.
    expect(pxFromMin(590, { startMin: 600, endMin: 720 }, 2)).toBe(-20);
  });
});
