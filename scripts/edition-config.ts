// Festival-edition config (ADR-0004/0018/0020): maps Sanity `_ref`s onto the
// app's stage/day model. Next edition, this file is what changes.

export type StageConfig = {
    /** Sanity programStage document `_id` (the `_ref` on artistProgram). */
    ref: string;
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

// Default-hidden Stages (PRD §Stage filter): three glanceable columns by
// default, ranked by headliner weight — Hagen is busiest by act count but
// still starts hidden, and Biblioteket is a talks stage. Opt-in via the
// Stage filter.
export const DEFAULT_HIDDEN_STAGES: readonly string[] = [
    "trekanten",
    "biblioteket",
];

// The Øyablikk palette (issue #6, ADR-0007): seven saturated fills on black,
// colour-blind-safe as a set and text-contrast checked — thresholds pinned
// by scripts/validate-palette.test.ts. The accent (NOW line/pill, logo,
// controls) is the eighth token; no fill sits near it in any vision.
export const ACCENT = "#3ddc7f";

export const OYA_2026: EditionConfig = {
    stages: [
        {
            ref: "f061f3d9-f2c6-4882-8b5b-83083a41bfa8",
            id: "amfiet",
            name: "Amfiet",
            color: "#f42d0a",
            textColor: "#000000",
        },
        {
            ref: "0b04f2ed-a2d9-4d01-813e-9aa20fb47583",
            id: "sirkus",
            name: "Sirkus",
            color: "#f8e91b",
            textColor: "#000000",
        },
        {
            ref: "4a922a65-334d-4865-b121-216b792b9601",
            id: "vindfruen",
            name: "Vindfruen",
            color: "#1e99b8",
            textColor: "#000000",
        },
        {
            ref: "daf35a73-6a14-4feb-8632-2cda26c10920",
            id: "hagen",
            name: "Hagen",
            color: "#ed0799",
            textColor: "#000000",
        },
        {
            ref: "b6872cfb-24b2-4422-8482-ce2e8a21d27c",
            id: "klubben",
            name: "Klubben",
            color: "#e074fb",
            textColor: "#000000",
        },
        {
            ref: "437b5e97-5194-4016-959d-8011b159c85d",
            id: "trekanten",
            name: "Trekanten",
            color: "#5762fa",
            textColor: "#000000",
        },
        {
            ref: "01701e47-2d06-4172-b191-e6e679ee6d6a",
            id: "biblioteket",
            name: "Biblioteket",
            color: "#b36161",
            textColor: "#000000",
        },
    ],
    days: {
        "9f92e560-26e7-465f-8119-cf1ff9a7ca2f": "2026-08-12",
        "6c285ba9-633e-4a98-83f9-88dd6ca10a6d": "2026-08-13",
        "3fb1eb20-2007-4b40-9b1b-6aefe84af25f": "2026-08-14",
        "4b216316-1293-4cab-a390-58b66415829e": "2026-08-15",
    },
    parkTypes: ["festival"],
    excludedTypes: ["club", "oyanatt"],
};
