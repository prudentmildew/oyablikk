// Day standing through a real boot (ADR-0022), at a festival-day instant so
// one of the panes actually is today. Separate file from main.test.ts, which
// boots off-festival and pins the dormant case — main.ts is a module with
// import side effects, so each clock needs its own file.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../data/schedule.json", async () => ({
  default: (await import("./fixtures/schedule.fixture.json")).default,
}));

// Fixture panes: Tue 11, Wed 12, Thu 13 August 2026, envelope 13:00–23:00.
const PANE_WIDTH = 320;

function daysEl(): HTMLElement {
  return document.querySelector(".days") as HTMLElement;
}

function scheduleEl(): HTMLElement {
  return document.querySelector(".schedule") as HTMLElement;
}

// happy-dom lays nothing out, so the view sees zero width and skips its
// active-pane maths. Give it a width and drive the scroll by hand.
function swipeToPane(idx: number): void {
  daysEl().scrollLeft = idx * PANE_WIDTH;
  daysEl().dispatchEvent(new Event("scroll"));
}

beforeAll(async () => {
  // Oslo 18:00 on Wednesday 12 August 2026 — mid-programme on the middle
  // fixture pane, so the Now line is inside the envelope and visible.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-12T16:00:00Z"));

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");

  Object.defineProperty(daysEl(), "clientWidth", { value: PANE_WIDTH, configurable: true });
});

describe("today's pane", () => {
  it("replaces the date with the TODAY chip", () => {
    expect(document.querySelector(".app-today-chip")?.textContent).toBe("Today");
    expect(document.querySelector(".app-day-label")?.getAttribute("aria-current")).toBe("date");
  });

  it("offers no way back to a pane you are already on", () => {
    expect(document.querySelector(".app-today-button")).toBeNull();
  });

  it("leaves the Now line at its full accent treatment", () => {
    expect(scheduleEl().dataset.nowStanding).toBe("today");
    expect(document.querySelectorAll(".now-line").length).toBe(1);
    expect(document.querySelectorAll(".now-pill").length).toBe(1);
  });
});

describe("swiping off today", () => {
  it("shows the date as a button back to today on a future pane", () => {
    swipeToPane(2); // Thursday 13 August

    const back = document.querySelector(".app-today-button") as HTMLElement;
    expect(back).not.toBeNull();
    expect(back.textContent?.trim()).toBe("Thu 13 Aug");
    expect(back.getAttribute("aria-label")).toBe("Back to today");
    // Drawn, not typed — the latin-subset font has no arrows block (ADR-0011).
    expect(back.querySelector(".app-today-arrow svg")).not.toBeNull();
    expect(document.querySelector(".app-today-chip")).toBeNull();
    expect(document.querySelector(".app-day-label")?.getAttribute("aria-current")).toBeNull();
  });

  it("dims the Now line via the standing on the schedule container", () => {
    expect(scheduleEl().dataset.nowStanding).toBe("future");
  });

  it("marks an earlier pane as past", () => {
    swipeToPane(0); // Tuesday 11 August
    expect(scheduleEl().dataset.nowStanding).toBe("past");
    expect((document.querySelector(".app-today-button") as HTMLElement).textContent?.trim()).toBe(
      "Tue 11 Aug",
    );
  });
});

describe("back to today", () => {
  it("returns to today's pane and restores the chip", () => {
    swipeToPane(2);
    (document.querySelector(".app-today-button") as HTMLElement).click();

    expect(daysEl().scrollLeft).toBe(PANE_WIDTH); // Wednesday, pane 1
    expect(document.querySelector(".app-today-chip")).not.toBeNull();
    expect(scheduleEl().dataset.nowStanding).toBe("today");
  });

  it("does not retire the first-visit swipe nudge (ADR-0017 §3)", () => {
    // The jump is navigation the user was handed, not the gesture the nudge
    // exists to teach. Cleared first because the swipe above is genuine.
    swipeToPane(2);
    localStorage.removeItem("oya.hasSwiped");

    (document.querySelector(".app-today-button") as HTMLElement).click();

    expect(localStorage.getItem("oya.hasSwiped")).toBeNull();
  });
});
