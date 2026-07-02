// Thin IO shell around the pure core (ADR-0020): fetch from Øya's public
// Sanity content lake, transform, write data/schedule.json. Exits non-zero
// on any failure so the nightly refresh aborts before committing.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { OYA_2026 } from "./edition-config.ts";
import { type SourceArtist, formatExcludedSummary, toSchedule } from "./to-schedule.ts";

// Date-pinned API version so upstream query-engine changes can't silently
// alter results (ADR-0020). The env override exists for tests only.
const SANITY_URL =
  process.env.SANITY_URL ?? "https://sehba7v8.api.sanity.io/v2025-02-19/data/query/production";

// Projects only the consumed fields and joins day/stage refs in-query.
// Deliberately fetches ALL 2026 artists — the type allowlist runs in the
// core so unknown type values fail loud instead of being filtered away.
const GROQ = `*[_type=="artist" && artistYear==2026]{
  _id,
  name,
  type,
  "program": artistProgram{
    "start": programStartTime,
    "end": programEndTime,
    "dayRef": programDay._ref,
    "day": programDay->day,
    "stageRef": programStage._ref,
    "stage": programStage->stage
  }
} | order(_id asc)`;

const OUTPUT_PATH = fileURLToPath(new URL("../data/schedule.json", import.meta.url));

async function main(): Promise<void> {
  const response = await fetch(`${SANITY_URL}?query=${encodeURIComponent(GROQ)}`);
  if (!response.ok) {
    throw new Error(`Sanity query failed: HTTP ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as { result?: unknown };
  if (!Array.isArray(body.result)) {
    throw new Error("Sanity response has no result array — the API shape changed.");
  }

  const { schedule, excluded } = toSchedule(body.result as SourceArtist[], OYA_2026);

  if (excluded.length > 0) {
    console.warn(formatExcludedSummary(excluded));
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(schedule, null, 2)}\n`);

  const actCount = schedule.days.reduce(
    (sum, day) => sum + Object.values(day.acts).flat().length,
    0,
  );
  console.log(
    `Wrote ${OUTPUT_PATH}: ${actCount} acts across ${schedule.days.length} days ` +
      `and ${schedule.stages.length} stages.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
