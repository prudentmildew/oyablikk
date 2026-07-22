// Pure core of the fetch pipeline (ADR-0020): Sanity artist docs in,
// canonical Schedule out. All validation is fail-loud (ADR-0006) — the
// output is either correct or absent, never partial.

import type { Act, Schedule } from "../src/schedule.ts";
import type { EditionConfig } from "./edition-config.ts";

export type SourceArtist = {
  _id: string;
  name: string;
  type: string;
  program: {
    start: string | null;
    end: string | null;
    dayRef: string | null;
    day: string | null;
    stageRef: string | null;
    stage: string | null;
  } | null;
};

export type Excluded = {
  name: string;
  type: string;
};

export type ToScheduleResult = {
  schedule: Schedule;
  /** Known non-park acts dropped by design — the shell warns once, naming them. */
  excluded: Excluded[];
};

/** One line naming every dropped non-park act, grouped by type, for the shell's single warn. */
export function formatExcludedSummary(excluded: Excluded[]): string {
  const byType = new Map<string, string[]>();
  for (const act of excluded) {
    const names = byType.get(act.type);
    if (names === undefined) {
      byType.set(act.type, [act.name]);
    } else {
      names.push(act.name);
    }
  }
  const groups = [...byType.entries()]
    .map(([type, names]) => `${type} (${names.length}): ${names.join(", ")}`)
    .join("; ");
  return `Excluded ${excluded.length} known non-park acts — ${groups}`;
}

export function toSchedule(artists: SourceArtist[], config: EditionConfig): ToScheduleResult {
  const excluded: Excluded[] = [];
  const actsByDayAndStage = new Map<string, Map<string, Act[]>>();
  const seenIds = new Set<string>();

  for (const artist of artists) {
    if (config.excludedTypes.includes(artist.type)) {
      excluded.push({ name: artist.name, type: artist.type });
      continue;
    }
    if (!config.parkTypes.includes(artist.type)) {
      throw new Error(
        `Unknown type "${artist.type}" on "${artist.name}" (${artist._id}). Decide whether it is a park or non-park type and add it to the edition config.`,
      );
    }

    const program = artist.program;
    if (program === null) {
      throw new Error(`Park act "${artist.name}" (${artist._id}) has no artistProgram.`);
    }

    const stage = config.stages.find((s) => s.ref === program.stageRef);
    if (stage === undefined) {
      throw new Error(
        `Unmapped stage ref "${program.stageRef}" (resolves to "${program.stage}") on ` +
          `"${artist.name}". Add it to the edition config's stages.`,
      );
    }

    const date = program.dayRef === null ? undefined : config.days[program.dayRef];
    if (date === undefined) {
      throw new Error(
        `Unmapped day ref "${program.dayRef}" (resolves to "${program.day}") on ` +
          `"${artist.name}". Add it to the edition config's days.`,
      );
    }
    if (program.day !== date) {
      throw new Error(
        `Day ref "${program.dayRef}" now resolves to "${program.day}" but the config expects "${date}". Upstream edited the day document — confirm the mapping still holds.`,
      );
    }

    const start = parseTime(program.start, "start", artist);
    const end = parseTime(program.end, "end", artist);
    if (end.minutes <= start.minutes) {
      throw new Error(
        `Park act "${artist.name}" (${artist._id}) ends at ${end.hhmm}, ` +
          `which is not after its ${start.hhmm} start. Park acts never cross midnight.`,
      );
    }

    if (seenIds.has(artist._id)) {
      throw new Error(
        `Duplicate act id "${artist._id}" ("${artist.name}"). One artist document should carry exactly one artistProgram — Sanity's model may have changed.`,
      );
    }
    seenIds.add(artist._id);

    const act: Act = {
      id: artist._id,
      name: artist.name,
      start: start.hhmm,
      end: end.hhmm,
      start_min: start.minutes,
      end_min: end.minutes,
    };

    let dayActs = actsByDayAndStage.get(date);
    if (dayActs === undefined) {
      dayActs = new Map();
      actsByDayAndStage.set(date, dayActs);
    }
    const stageActs = dayActs.get(stage.id);
    if (stageActs === undefined) {
      dayActs.set(stage.id, [act]);
    } else {
      stageActs.push(act);
    }
  }

  const days = [...actsByDayAndStage.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, dayActs]) => {
      const all = [...dayActs.values()].flat();
      const acts: Record<string, Act[]> = {};
      for (const stage of config.stages) {
        acts[stage.id] = (dayActs.get(stage.id) ?? []).sort(
          (a, b) => a.start_min - b.start_min || (a.id < b.id ? -1 : 1),
        );
      }
      return {
        date,
        start_min: Math.min(...all.map((a) => a.start_min)),
        end_min: Math.max(...all.map((a) => a.end_min)),
        acts,
      };
    });

  return {
    schedule: {
      stages: config.stages.map(({ id, name, color, textColor }) => ({
        id,
        name,
        color,
        textColor,
      })),
      days,
    },
    excluded,
  };
}

/** Validates an "HH:MM" wall-clock time and converts it to minutes since midnight. */
function parseTime(
  value: string | null,
  field: "start" | "end",
  artist: SourceArtist,
): { hhmm: string; minutes: number } {
  if (value === null) {
    throw new Error(`Park act "${artist.name}" (${artist._id}) is missing its ${field} time.`);
  }
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (match === null) {
    throw new Error(
      `Park act "${artist.name}" (${artist._id}) has a malformed ${field} time "${value}".`,
    );
  }
  return { hhmm: value, minutes: Number(match[1]) * 60 + Number(match[2]) };
}
