import { describe, expect, it } from "vitest";
import { hasSwiped, nudgeDirection, recordSwiped, shouldPlayNudge } from "./swipe-nudge.ts";

function makeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
    key: (i) => Array.from(data.keys())[i] ?? null,
  };
}

describe("swipe-nudge state", () => {
  it("reports not-swiped on a fresh storage", () => {
    expect(hasSwiped(makeStorage())).toBe(false);
  });

  it("reports swiped once recorded, under the oya.* key", () => {
    const storage = makeStorage();
    recordSwiped(storage);
    expect(hasSwiped(storage)).toBe(true);
    expect(storage.getItem("oya.hasSwiped")).not.toBeNull();
  });
});

describe("nudgeDirection", () => {
  it("peeks forward from the first Day", () => {
    expect(nudgeDirection(0, 5)).toBe("forward");
  });

  it("peeks forward from a middle Day", () => {
    expect(nudgeDirection(2, 5)).toBe("forward");
  });

  it("peeks backward from the last Day (no next pane to reveal)", () => {
    expect(nudgeDirection(4, 5)).toBe("backward");
  });

  it("peeks backward when the only Day is also the last Day", () => {
    expect(nudgeDirection(0, 1)).toBe("backward");
  });
});

describe("shouldPlayNudge", () => {
  it("plays for a fresh, motion-allowing visitor with no install sheet", () => {
    expect(
      shouldPlayNudge({ hasSwiped: false, reducedMotion: false, installSheetShowing: false }),
    ).toBe(true);
  });

  it("does not play once the user has swiped", () => {
    expect(
      shouldPlayNudge({ hasSwiped: true, reducedMotion: false, installSheetShowing: false }),
    ).toBe(false);
  });

  it("does not play under reduced motion", () => {
    expect(
      shouldPlayNudge({ hasSwiped: false, reducedMotion: true, installSheetShowing: false }),
    ).toBe(false);
  });

  it("defers to the install sheet when it is showing", () => {
    expect(
      shouldPlayNudge({ hasSwiped: false, reducedMotion: false, installSheetShowing: true }),
    ).toBe(false);
  });
});
