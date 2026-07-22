// Objective palette validation (issue #6, ADR-0007): the seven stage fills
// must be colour-blind-safe AS A SET and every fill must carry readable act
// text. Run directly (`node scripts/validate-palette.ts`) for a report, or
// through validate-palette.test.ts where CI pins the thresholds.
//
// CVD simulation: Machado, Oliveira & Fernandes (2009), severity 1.0,
// applied in linear RGB. Distances are CIE76 ΔE in Lab — coarse but ample
// for full-column fills, and the thresholds carry margin.

import type { StageConfig } from "./edition-config.ts";

export type Vision = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

type PaletteStage = Pick<StageConfig, "id" | "color" | "textColor">;

export type PaletteReport = {
  textContrast: { id: string; ratio: number }[];
  fillOnBlack: { id: string; ratio: number }[];
  /** Smallest pairwise fill distance per vision, with the offending pair. */
  pairGaps: Record<Vision, { min: number; pair: string }>;
  /** Smallest accent-to-fill distance per vision, with the nearest fill. */
  accentGaps: Record<Vision, { min: number; id: string }>;
};

const VISIONS: Vision[] = ["normal", "protanopia", "deuteranopia", "tritanopia"];

// Machado et al. 2009, severity 1.0.
const CVD_MATRIX: Record<Exclude<Vision, "normal">, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function hexToLinearRgb(hex: string): [number, number, number] {
  const srgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return [r as number, g as number, b as number];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two colours, ≥ 1. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

function simulate(hex: string, vision: Vision): [number, number, number] {
  const rgb = hexToLinearRgb(hex);
  if (vision === "normal") return rgb;
  const m = CVD_MATRIX[vision];
  const mix = (row: number[]) =>
    Math.min(
      1,
      Math.max(
        0,
        (row[0] as number) * rgb[0] + (row[1] as number) * rgb[1] + (row[2] as number) * rgb[2],
      ),
    );
  return [mix(m[0] as number[]), mix(m[1] as number[]), mix(m[2] as number[])];
}

function linearRgbToLab([r, g, b]: [number, number, number]): [number, number, number] {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function deltaE(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function validatePalette(stages: PaletteStage[], accent: string): PaletteReport {
  const pairGaps = {} as PaletteReport["pairGaps"];
  const accentGaps = {} as PaletteReport["accentGaps"];

  for (const vision of VISIONS) {
    const labs = stages.map((s) => linearRgbToLab(simulate(s.color, vision)));
    const accentLab = linearRgbToLab(simulate(accent, vision));

    let pair = { min: Number.POSITIVE_INFINITY, pair: "" };
    for (let i = 0; i < stages.length; i++) {
      for (let j = i + 1; j < stages.length; j++) {
        const d = deltaE(labs[i] as [number, number, number], labs[j] as [number, number, number]);
        if (d < pair.min) {
          pair = { min: d, pair: `${stages[i]?.id}/${stages[j]?.id}` };
        }
      }
    }
    pairGaps[vision] = pair;

    let accentGap = { min: Number.POSITIVE_INFINITY, id: "" };
    for (let i = 0; i < stages.length; i++) {
      const d = deltaE(labs[i] as [number, number, number], accentLab);
      if (d < accentGap.min) {
        accentGap = { min: d, id: stages[i]?.id ?? "" };
      }
    }
    accentGaps[vision] = accentGap;
  }

  return {
    textContrast: stages.map((s) => ({ id: s.id, ratio: contrastRatio(s.color, s.textColor) })),
    fillOnBlack: stages.map((s) => ({ id: s.id, ratio: contrastRatio(s.color, "#000000") })),
    pairGaps,
    accentGaps,
  };
}

// CLI report for palette work and PR evidence.
const { pathToFileURL } = await import("node:url");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { OYA_2026, ACCENT } = await import("./edition-config.ts");
  const report = validatePalette(OYA_2026.stages, ACCENT);
  console.log("text contrast on fill (≥4.5):");
  for (const r of report.textContrast) console.log(`  ${r.id.padEnd(10)} ${r.ratio.toFixed(2)}`);
  console.log("fill on black (≥3):");
  for (const r of report.fillOnBlack) console.log(`  ${r.id.padEnd(10)} ${r.ratio.toFixed(2)}`);
  console.log("min pairwise fill ΔE (normal ≥30, CVD ≥18) / accent gap (≥20):");
  for (const v of VISIONS) {
    const p = report.pairGaps[v];
    const a = report.accentGaps[v];
    console.log(
      `  ${v.padEnd(13)} ${p.min.toFixed(1)} (${p.pair})   accent ${a.min.toFixed(1)} (${a.id})`,
    );
  }
}
