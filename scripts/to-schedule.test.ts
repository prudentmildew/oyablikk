import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type EditionConfig, OYA_2026 } from "./edition-config.ts";
import { formatExcludedSummary, type SourceArtist, toSchedule } from "./to-schedule.ts";

// A two-stage, two-day edition small enough to hand-compute expectations.
const CONFIG: EditionConfig = {
  stages: [
    {
      ref: "stage-main-ref",
      id: "main",
      name: "Main",
      color: "#111111",
      textColor: "#ffffff",
    },
    {
      ref: "stage-side-ref",
      id: "side",
      name: "Side",
      color: "#222222",
      textColor: "#ffffff",
    },
  ],
  days: {
    "day-wed-ref": "2026-08-12",
    "day-thu-ref": "2026-08-13",
  },
  parkTypes: ["festival"],
  excludedTypes: ["club", "oyanatt"],
};

type ArtistOverrides = Omit<Partial<SourceArtist>, "program"> & {
  program?: Partial<NonNullable<SourceArtist["program"]>> | null;
};

function artist(overrides: ArtistOverrides): SourceArtist {
  const { program, ...rest } = overrides;
  return {
    _id: "artist-1",
    name: "Test Artist",
    type: "festival",
    ...rest,
    program:
      program === null
        ? null
        : {
            start: "12:00",
            end: "13:00",
            dayRef: "day-wed-ref",
            day: "2026-08-12",
            stageRef: "stage-main-ref",
            stage: "Main",
            ...program,
          },
  };
}

describe("toSchedule", () => {
  it("turns a park artist into an act on the right day and stage", () => {
    const { schedule } = toSchedule(
      [artist({ _id: "a1", name: "Dumdum Boys", program: { start: "21:30", end: "23:00" } })],
      CONFIG,
    );

    expect(schedule.stages).toEqual([
      { id: "main", name: "Main", color: "#111111", textColor: "#ffffff" },
      { id: "side", name: "Side", color: "#222222", textColor: "#ffffff" },
    ]);
    expect(schedule.days).toHaveLength(1);
    expect(schedule.days[0]).toEqual({
      date: "2026-08-12",
      start_min: 1290, // 21:30
      end_min: 1380, // 23:00
      acts: {
        main: [
          {
            id: "a1",
            name: "Dumdum Boys",
            start: "21:30",
            end: "23:00",
            start_min: 1290,
            end_min: 1380,
          },
        ],
        side: [],
      },
    });
  });

  it("throws on an unknown type value instead of guessing park/non-park", () => {
    expect(() =>
      toSchedule([artist({ name: "Mystery Panel", type: "dj-set" })], CONFIG),
    ).toThrowError(/unknown type "dj-set".*Mystery Panel/i);
  });

  it("throws when an act ends at or before its start (the past-midnight case)", () => {
    expect(() =>
      toSchedule(
        [artist({ name: "Night Owl", program: { start: "23:30", end: "01:00" } })],
        CONFIG,
      ),
    ).toThrowError(/Night Owl.*01:00.*not after.*23:30/i);
    expect(() =>
      toSchedule([artist({ program: { start: "12:00", end: "12:00" } })], CONFIG),
    ).toThrowError(/not after/i);
  });

  it("throws when two acts share an id (Sanity remodelled — a human must look)", () => {
    expect(() =>
      toSchedule(
        [
          artist({ _id: "dup", name: "Twin A" }),
          artist({ _id: "dup", name: "Twin B", program: { start: "14:00", end: "15:00" } }),
        ],
        CONFIG,
      ),
    ).toThrowError(/duplicate act id "dup"/i);
  });

  it("throws when a mapped day document no longer carries the configured date", () => {
    expect(() => toSchedule([artist({ program: { day: "2026-08-20" } })], CONFIG)).toThrowError(
      /day.*"2026-08-20".*config.*"2026-08-12"/i,
    );
  });

  it("excludes known non-park types, reporting what was dropped", () => {
    const { schedule, excluded } = toSchedule(
      [
        artist({ _id: "a1", name: "Park Act" }),
        artist({ _id: "a2", name: "Club Act", type: "club", program: null }),
        artist({ _id: "a3", name: "Night Act", type: "oyanatt", program: null }),
      ],
      CONFIG,
    );

    expect(excluded).toEqual([
      { name: "Club Act", type: "club" },
      { name: "Night Act", type: "oyanatt" },
    ]);
    const allActs = schedule.days.flatMap((d) => Object.values(d.acts).flat());
    expect(allActs.map((a) => a.name)).toEqual(["Park Act"]);

    expect(formatExcludedSummary(excluded)).toBe(
      "Excluded 2 known non-park acts — club (1): Club Act; oyanatt (1): Night Act",
    );
  });

  it("throws on an unmapped stage ref, naming the resolved stage", () => {
    expect(() =>
      toSchedule([artist({ program: { stageRef: "stage-new-ref", stage: "Nyscenen" } })], CONFIG),
    ).toThrowError(/unmapped stage ref "stage-new-ref".*Nyscenen/i);
  });

  it("throws on an unmapped day ref, naming the resolved date", () => {
    expect(() =>
      toSchedule([artist({ program: { dayRef: "day-sun-ref", day: "2026-08-16" } })], CONFIG),
    ).toThrowError(/unmapped day ref "day-sun-ref".*2026-08-16/i);
  });

  it("throws on a park act with no programme or missing times", () => {
    expect(() =>
      toSchedule([artist({ name: "No Programme", program: null })], CONFIG),
    ).toThrowError(/No Programme.*no artistProgram/i);
    expect(() =>
      toSchedule([artist({ name: "No Start", program: { start: null } })], CONFIG),
    ).toThrowError(/No Start.*missing.*start/i);
    expect(() =>
      toSchedule([artist({ name: "Bad End", program: { end: "9pm" } })], CONFIG),
    ).toThrowError(/Bad End.*malformed end.*9pm/i);
  });

  it("sorts days by date and acts by start time within a stage", () => {
    const { schedule } = toSchedule(
      [
        artist({
          _id: "thu-act",
          name: "Thursday",
          program: { dayRef: "day-thu-ref", day: "2026-08-13", start: "12:00", end: "13:00" },
        }),
        artist({ _id: "wed-late", name: "Wed Late", program: { start: "18:00", end: "19:00" } }),
        artist({ _id: "wed-early", name: "Wed Early", program: { start: "11:00", end: "12:00" } }),
        artist({
          _id: "wed-side",
          name: "Wed Side",
          program: { stageRef: "stage-side-ref", stage: "Side", start: "22:00", end: "22:45" },
        }),
      ],
      CONFIG,
    );

    expect(schedule.days.map((d) => d.date)).toEqual(["2026-08-12", "2026-08-13"]);
    const wed = schedule.days[0];
    expect(wed?.acts.main?.map((a) => a.name)).toEqual(["Wed Early", "Wed Late"]);
    // The day envelope spans all stages: 11:00 (main) to 22:45 (side).
    expect(wed?.start_min).toBe(660);
    expect(wed?.end_min).toBe(1365);
  });
});

describe("toSchedule against the captured 2026 Sanity response", () => {
  it("produces the full park schedule (fixture frozen 2 July 2026)", async () => {
    const fixture = (await import("./fixtures/sanity-2026.json")).default as SourceArtist[];
    const { schedule, excluded } = toSchedule(fixture, OYA_2026);

    expect(schedule.stages.map((s) => s.id)).toEqual([
      "amfiet",
      "sirkus",
      "vindfruen",
      "hagen",
      "klubben",
      "trekanten",
      "biblioteket",
    ]);
    expect(schedule.days.map((d) => d.date)).toEqual([
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);

    const allActs = schedule.days.flatMap((d) => Object.values(d.acts).flat());
    expect(allActs).toHaveLength(82);
    expect(new Set(allActs.map((a) => a.id)).size).toBe(82);
    expect(excluded).toHaveLength(53);

    // The lone Tuesday opening act, straight from the source data.
    const tuesday = schedule.days[0];
    expect(Object.values(tuesday?.acts ?? {}).flat()).toEqual([
      {
        id: expect.any(String),
        name: "Karl Hjalmar Nyberg",
        start: "21:30",
        end: "22:00",
        start_min: 1290,
        end_min: 1320,
      },
    ]);
    expect(tuesday?.acts.trekanten).toHaveLength(1);
  });

  it("is input-order invariant, so nightly reruns produce byte-identical JSON", async () => {
    const fixture = (await import("./fixtures/sanity-2026.json")).default as SourceArtist[];
    const forward = toSchedule(fixture, OYA_2026).schedule;
    const reversed = toSchedule([...fixture].reverse(), OYA_2026).schedule;
    expect(JSON.stringify(reversed)).toBe(JSON.stringify(forward));
  });
});

describe("fetch-schedule shell", () => {
  it("exits non-zero and writes nothing when the fetch fails", () => {
    // node:path instead of URL — happy-dom's global URL can't do file: schemes.
    const script = join(import.meta.dirname, "fetch-schedule.ts");
    let status: number | null = null;
    try {
      execFileSync("node", [script], {
        // An unroutable endpoint: connection is refused immediately.
        env: { ...process.env, SANITY_URL: "http://127.0.0.1:1" },
        stdio: "pipe",
      });
      status = 0;
    } catch (error) {
      status = (error as { status: number | null }).status;
    }
    expect(status).not.toBe(0);
  });
});
