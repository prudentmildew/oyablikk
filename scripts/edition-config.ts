// Festival-edition config (ADR-0004/0018/0020): maps Sanity `_ref`s onto the
// app's stage/day model. Next edition, this file is what changes.

export type StageConfig = {
  /** Sanity programStage document `_id` (the `_ref` on artistProgram). */
  ref: string;
  /** The `stage` field on that document — cross-checked on every fetch. */
  sourceName: string;
  id: string;
  name: string;
  color: string;
  textColor: string;
};

export type EditionConfig = {
  /** Stages in display order. */
  stages: StageConfig[];
  /** Sanity programDay `_ref` → { ISO date cross-checked against `->day` }. */
  days: Record<string, string>;
  /** `type` values that are park acts (included). */
  parkTypes: readonly string[];
  /** `type` values that are known non-park acts (excluded with a warn). */
  excludedTypes: readonly string[];
};

// Off-festival launch pane (ADR-0008): the first FULL programme day, chosen
// explicitly rather than derived as days[0] — the year-round default view
// should be a real schedule, not the one-act Tuesday. Read by the app entry.
export const FALLBACK_DAY = "2026-08-12";

// Placeholder palette — the real six-colour set + accent is issue #6 (ADR-0007).
export const OYA_2026: EditionConfig = {
  stages: [
    {
      ref: "f061f3d9-f2c6-4882-8b5b-83083a41bfa8",
      sourceName: "Amfiet",
      id: "amfiet",
      name: "Amfiet",
      color: "#e05252",
      textColor: "#000000",
    },
    {
      ref: "0b04f2ed-a2d9-4d01-813e-9aa20fb47583",
      sourceName: "Sirkus",
      id: "sirkus",
      name: "Sirkus",
      color: "#e0a852",
      textColor: "#000000",
    },
    {
      ref: "4a922a65-334d-4865-b121-216b792b9601",
      sourceName: "Vindfruen",
      id: "vindfruen",
      name: "Vindfruen",
      color: "#52c8e0",
      textColor: "#000000",
    },
    {
      ref: "daf35a73-6a14-4feb-8632-2cda26c10920",
      sourceName: "Hagen",
      id: "hagen",
      name: "Hagen",
      color: "#7de052",
      textColor: "#000000",
    },
    {
      ref: "b6872cfb-24b2-4422-8482-ce2e8a21d27c",
      sourceName: "Klubben",
      id: "klubben",
      name: "Klubben",
      color: "#b78ee8",
      textColor: "#000000",
    },
    {
      ref: "437b5e97-5194-4016-959d-8011b159c85d",
      sourceName: "Trekanten",
      id: "trekanten",
      name: "Trekanten",
      color: "#e8d34f",
      textColor: "#000000",
    },
  ],
  days: {
    "419a4e4b-45f6-4bab-bc95-8194eb302455": "2026-08-11",
    "9f92e560-26e7-465f-8119-cf1ff9a7ca2f": "2026-08-12",
    "6c285ba9-633e-4a98-83f9-88dd6ca10a6d": "2026-08-13",
    "3fb1eb20-2007-4b40-9b1b-6aefe84af25f": "2026-08-14",
    "4b216316-1293-4cab-a390-58b66415829e": "2026-08-15",
  },
  parkTypes: ["festival"],
  excludedTypes: ["club", "oyanatt"],
};
