// The palette is a validated artefact (issue #6): WCAG text contrast on
// every fill, and pairwise Lab distance of the seven fills under normal vision
// and Machado-2009 CVD simulations. These tests pin the SHIPPED palette to
// the thresholds — a future tweak that breaks the set fails CI, not eyes.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCENT, OYA_2026 } from "./edition-config.ts";
import { contrastRatio, validatePalette } from "./validate-palette.ts";

describe("contrastRatio", () => {
  it("black on white is 21:1, a colour against itself is 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#1e99b8", "#1e99b8")).toBeCloseTo(1, 5);
  });
});

describe("CVD simulation sanity", () => {
  it("collapses pure red and pure green under deuteranopia", () => {
    // The simulation must actually remove red-green difference, or the
    // pairwise checks below prove nothing.
    const normal = validatePalette(
      [
        { id: "r", color: "#ff0000", textColor: "#000000" },
        { id: "g", color: "#00b400", textColor: "#000000" },
      ],
      "#ffffff",
    );
    const normalGap = normal.pairGaps.normal.min;
    const deutanGap = normal.pairGaps.deuteranopia.min;
    expect(deutanGap).toBeLessThan(normalGap / 3);
  });
});

describe("the shipped Øyablikk palette", () => {
  const report = validatePalette(OYA_2026.stages, ACCENT);

  it("gives every stage readable act text: contrast ≥ 4.5 on its fill", () => {
    for (const row of report.textContrast) {
      expect(row.ratio, `${row.id} text on fill`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps every fill visible on the black background (≥ 3:1)", () => {
    for (const row of report.fillOnBlack) {
      expect(row.ratio, `${row.id} fill vs black`).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the seven fills pairwise glance-distinct for normal vision (ΔE ≥ 30)", () => {
    expect(report.pairGaps.normal.min).toBeGreaterThanOrEqual(30);
  });

  it.each(["protanopia", "deuteranopia", "tritanopia"] as const)(
    "keeps the seven fills pairwise distinguishable under %s (ΔE ≥ 18)",
    (vision) => {
      expect(
        report.pairGaps[vision].min,
        `worst pair: ${report.pairGaps[vision].pair}`,
      ).toBeGreaterThanOrEqual(18);
    },
  );

  it("keeps the accent apart from every fill in all visions (ΔE ≥ 20)", () => {
    // The NOW line crosses every column; it must never vanish into a fill.
    for (const [vision, gap] of Object.entries(report.accentGaps)) {
      expect(gap.min, `accent vs ${gap.id} under ${vision}`).toBeGreaterThanOrEqual(20);
    }
  });

  it("is the palette the app actually renders: schedule.json carries it", () => {
    const shipped = JSON.parse(readFileSync("data/schedule.json", "utf8"));
    expect(shipped.stages).toEqual(
      OYA_2026.stages.map(({ id, name, color, textColor }) => ({ id, name, color, textColor })),
    );
  });

  it("is the accent styles.css draws with", () => {
    const css = readFileSync("src/styles.css", "utf8");
    expect(css).toContain(`--accent: ${ACCENT};`);
  });
});
