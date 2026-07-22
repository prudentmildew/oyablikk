// Reload persistence: a hidden-stage set saved on a previous visit must
// survive into the next boot. Separate file from main.test.ts so main.ts
// re-runs its import side effects against the seeded localStorage.
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));

  // A previous visit hid everything except Hagen and Klubben.
  localStorage.setItem(
    "oya.hiddenStages",
    JSON.stringify(["amfiet", "sirkus", "vindfruen", "trekanten", "biblioteket"]),
  );

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");
});

describe("app boot (persisted stage filter)", () => {
  it("renders the stored visible set, not the defaults", () => {
    const labels = [...document.querySelectorAll(".stage-row .stage-label")];
    expect(labels.map((l) => l.textContent)).toEqual(["Hagen", "Klubben"]);
  });
});
