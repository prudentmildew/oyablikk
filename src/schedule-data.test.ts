// Contract test for the REAL committed data/schedule.json.
//
// The nightly refresh (ADR-0020) rewrites this file from the Sanity content
// lake and deploys straight after, so nothing here may pin programme content
// — no act names, no counts, no dates beyond the edition config. What it does
// pin is the shape the app relies on (ADR-0004): if fetch-schedule.ts ever
// emits something main.ts cannot render, this fails instead of the site
// quietly going blank. Behaviour lives in main.test.ts against a fixture.
import { describe, expect, it } from "vitest";
import scheduleData from "../data/schedule.json";
import { FALLBACK_DAY, OYA_2026 } from "../scripts/edition-config.ts";
import type { Schedule } from "./schedule.ts";

const schedule = scheduleData as Schedule;
const configuredStageIds = OYA_2026.stages.map((s) => s.id);
const allActs = schedule.days.flatMap((d) => Object.values(d.acts).flat());

describe("data/schedule.json — stages", () => {
  it("carries every configured Stage, in edition-config order", () => {
    expect(schedule.stages.map((s) => s.id)).toEqual(configuredStageIds);
  });

  it("gives every Stage a name and a colour pair the view can paint", () => {
    for (const stage of schedule.stages) {
      expect(stage.name.length, `${stage.id} name`).toBeGreaterThan(0);
      expect(stage.color, `${stage.id} color`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(stage.textColor, `${stage.id} textColor`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("data/schedule.json — days", () => {
  it("has at least one programme day", () => {
    expect(schedule.days.length).toBeGreaterThan(0);
  });

  it("uses ISO dates drawn from the edition config, in ascending order", () => {
    const dates = schedule.days.map((d) => d.date);
    const configured = Object.values(OYA_2026.days);
    for (const date of dates) expect(configured).toContain(date);
    expect(dates).toEqual([...dates].sort());
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("includes the off-festival launch pane (ADR-0008)", () => {
    // main.ts falls back to FALLBACK_DAY year-round; a refresh that dropped
    // that day would launch the app onto a pane that does not exist.
    expect(schedule.days.map((d) => d.date)).toContain(FALLBACK_DAY);
  });

  it("keys acts by every configured Stage id, and nothing else", () => {
    for (const day of schedule.days) {
      expect(Object.keys(day.acts).sort(), day.date).toEqual([...configuredStageIds].sort());
    }
  });

  it("gives each day an envelope that contains its own acts", () => {
    for (const day of schedule.days) {
      const acts = Object.values(day.acts).flat();
      expect(day.end_min, `${day.date} envelope`).toBeGreaterThan(day.start_min);
      for (const act of acts) {
        expect(act.start_min, `${day.date} ${act.name} start`).toBeGreaterThanOrEqual(
          day.start_min,
        );
        expect(act.end_min, `${day.date} ${act.name} end`).toBeLessThanOrEqual(day.end_min);
      }
    }
  });
});

describe("data/schedule.json — acts", () => {
  it("has acts to render at all", () => {
    expect(allActs.length).toBeGreaterThan(0);
  });

  it("gives every act a stable, unique id — the Favourites hook (ADR-0019)", () => {
    for (const act of allActs) expect(act.id, act.name).toBeTruthy();
    const ids = allActs.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every act a non-empty name", () => {
    for (const act of allActs) expect(act.name.trim().length, act.id).toBeGreaterThan(0);
  });

  it("keeps HH:MM and *_min in agreement, and ends after it starts", () => {
    // The view lays blocks out from *_min and labels them from HH:MM; a drift
    // between the two would render a block at the wrong time with a
    // plausible-looking label.
    const toMinutes = (hhmm: string): number => {
      const [h, m] = hhmm.split(":").map(Number) as [number, number];
      return h * 60 + m;
    };
    for (const act of allActs) {
      expect(act.start, act.id).toMatch(/^\d{2}:\d{2}$/);
      expect(act.end, act.id).toMatch(/^\d{2}:\d{2}$/);
      // Past-midnight ends wrap the clock but not the minute count, so compare
      // modulo the day (ADR-0008: *_min may exceed 1440).
      expect(act.start_min % 1440, `${act.id} start`).toBe(toMinutes(act.start));
      expect(act.end_min % 1440, `${act.id} end`).toBe(toMinutes(act.end));
      expect(act.end_min, `${act.id} duration`).toBeGreaterThan(act.start_min);
    }
  });

  it("never overlaps two acts on the same Stage on the same day", () => {
    for (const day of schedule.days) {
      for (const [stageId, acts] of Object.entries(day.acts)) {
        const sorted = [...acts].sort((a, b) => a.start_min - b.start_min);
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1] as (typeof sorted)[number];
          const cur = sorted[i] as (typeof sorted)[number];
          expect(
            cur.start_min,
            `${day.date} ${stageId}: ${prev.name} → ${cur.name}`,
          ).toBeGreaterThanOrEqual(prev.end_min);
        }
      }
    }
  });
});
