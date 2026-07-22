// Stage filter persistence: hidden Stages under an `oya.*` localStorage key,
// default-hidden set from the edition config (Trekanten, Biblioteket).
import { beforeEach, describe, expect, it } from "vitest";
import type { Stage } from "./schedule.ts";
import { loadHiddenStages, saveHiddenStages, visibleStages } from "./stage-filter.ts";

beforeEach(() => {
  localStorage.clear();
});

describe("loadHiddenStages", () => {
  it("returns the default-hidden set on fresh localStorage", () => {
    expect(loadHiddenStages()).toEqual(new Set(["trekanten", "biblioteket"]));
  });

  it("round-trips a saved set under the oya.* namespace", () => {
    saveHiddenStages(new Set(["hagen", "klubben"]));
    expect(localStorage.getItem("oya.hiddenStages")).not.toBeNull();
    expect(loadHiddenStages()).toEqual(new Set(["hagen", "klubben"]));
  });

  it("persists an empty set — all Stages visible is not the default", () => {
    saveHiddenStages(new Set());
    expect(loadHiddenStages()).toEqual(new Set());
  });

  it.each(["not json", '{"a":1}', "[1,2]"])(
    "falls back to the defaults on a corrupt stored value (%s)",
    (raw) => {
      localStorage.setItem("oya.hiddenStages", raw);
      expect(loadHiddenStages()).toEqual(new Set(["trekanten", "biblioteket"]));
    },
  );
});

describe("visibleStages", () => {
  const stage = (id: string): Stage => ({ id, name: id, color: "#000", textColor: "#fff" });
  const all = [stage("amfiet"), stage("sirkus"), stage("vindfruen"), stage("hagen")];

  it("drops hidden Stages and keeps the edition display order", () => {
    const visible = visibleStages(all, new Set(["sirkus"]));
    expect(visible.map((s) => s.id)).toEqual(["amfiet", "vindfruen", "hagen"]);
  });

  it("ignores hidden ids that match no Stage — stale keys are harmless", () => {
    const visible = visibleStages(all, new Set(["retired-stage"]));
    expect(visible.map((s) => s.id)).toEqual(["amfiet", "sirkus", "vindfruen", "hagen"]);
  });
});
