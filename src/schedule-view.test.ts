import { Window } from "happy-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createScheduleView } from "./schedule-view.ts";
import type { Act, Day, Schedule, Stage } from "./schedule.ts";

const stages: Stage[] = [
  { id: "a", name: "A", color: "#111", textColor: "#fff" },
  { id: "b", name: "B", color: "#222", textColor: "#fff" },
];

const sixStages: Stage[] = ["amfiet", "sirkus", "vindfruen", "hagen", "klubben", "trekanten"].map(
  (id) => ({ id, name: id, color: "#333", textColor: "#fff" }),
);

function makeDay(date: string, acts: Record<string, Act[]> = { a: [], b: [] }): Day {
  return { date, start_min: 600, end_min: 660, acts };
}

// Five programme days (Tue–Sat 2026) — the pane count must follow the data.
const schedule: Schedule = {
  stages,
  days: [
    makeDay("2026-08-11"),
    makeDay("2026-08-12"),
    makeDay("2026-08-13"),
    makeDay("2026-08-14"),
    makeDay("2026-08-15"),
  ],
};

const origin = { startMin: 600, endMin: 660 };

let container: HTMLElement;

function widen(el: HTMLElement, w: number, h = 800): void {
  Object.defineProperty(el, "clientWidth", { value: w, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: h, configurable: true });
}

beforeEach(() => {
  const window = new Window();
  (globalThis as unknown as { window: Window }).window = window;
  (globalThis as unknown as { document: Document }).document =
    window.document as unknown as Document;
  const section = window.document.createElement("section");
  window.document.body.appendChild(section);
  container = section as unknown as HTMLElement;
});

function daysEl(): HTMLElement {
  const el = container.querySelector(".days");
  if (!el) throw new Error(".days not found");
  return el as HTMLElement;
}

function makeView(sched: Schedule = schedule, cb: (day: Day) => void = () => {}) {
  return createScheduleView({
    container,
    schedule: sched,
    origin,
    pxPerMinute: 2,
    onActiveDayChange: cb,
  });
}

describe("ScheduleView.render", () => {
  it("builds a static stage row with one label per visible stage", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    const labels = container.querySelectorAll(".stage-row .stage-label");
    expect(labels.length).toBe(2);
    expect((labels[0] as HTMLElement).textContent).toBe("A");
    expect((labels[1] as HTMLElement).textContent).toBe("B");
  });

  it("mounts one pane per day in the data — five for the 2026 programme", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    expect(daysEl().children.length).toBe(5);
  });

  it("follows the data when the day count changes (no hardcoded pane count)", () => {
    const threeDaySchedule: Schedule = {
      stages,
      days: [makeDay("2027-08-10"), makeDay("2027-08-11"), makeDay("2027-08-12")],
    };
    const view = makeView(threeDaySchedule);
    view.render({ visibleStages: stages, nowMin: null });
    expect(daysEl().children.length).toBe(3);
  });

  it("renders six columns when all six stages are visible", () => {
    const view = makeView();
    view.render({ visibleStages: sixStages, nowMin: null });
    expect(container.querySelectorAll(".stage-row .stage-label").length).toBe(6);
    const firstPane = daysEl().children[0] as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(6);
  });

  it("renders only visible stages in each pane", () => {
    const view = makeView();
    view.render({ visibleStages: [stages[0] as Stage], nowMin: null });
    const labels = container.querySelectorAll(".stage-row .stage-label");
    expect(labels.length).toBe(1);
    const firstPane = daysEl().children[0] as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(1);
  });

  it("renders an act block with times, name, position, and its stable act id", () => {
    const act: Act = {
      id: "sanity-id-1",
      name: "Karl Hjalmar Nyberg",
      start: "10:30",
      end: "11:00",
      start_min: 630,
      end_min: 660,
    };
    const oneDay: Schedule = {
      stages,
      days: [makeDay("2026-08-11", { a: [act], b: [] })],
    };
    const view = makeView(oneDay);
    view.render({ visibleStages: stages, nowMin: null });

    const actEl = container.querySelector(".act") as HTMLElement;
    expect(actEl.dataset.actId).toBe("sanity-id-1");
    // 630 is 30 min past the 600 origin at 2 px/min.
    expect(actEl.style.top).toBe("60px");
    expect(actEl.style.height).toBe("60px");
    expect((actEl.querySelector(".act-start") as HTMLElement).textContent).toBe("10:30");
    expect((actEl.querySelector(".act-name") as HTMLElement).textContent).toBe(
      "Karl Hjalmar Nyberg",
    );
    expect((actEl.querySelector(".act-end") as HTMLElement).textContent).toBe("11:00");
  });

  it("replaces panes on re-render (does not accumulate)", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    view.render({ visibleStages: stages, nowMin: null });
    expect(daysEl().children.length).toBe(5);
  });

  it("renders the Now line as a single element at the Schedule level", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: 620 });
    expect(container.querySelectorAll(".now-line").length).toBe(1);
    expect(container.querySelectorAll(".now-pill").length).toBe(1);
    // No now-line lives inside any day pane.
    expect(daysEl().querySelectorAll(".now-line").length).toBe(0);
  });

  it("does not accumulate Now lines across re-renders", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: 620 });
    view.render({ visibleStages: stages, nowMin: 625 });
    expect(container.querySelectorAll(".now-line").length).toBe(1);
    expect(container.querySelectorAll(".now-pill").length).toBe(1);
  });

  it("omits the Now line when nowMin is null", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    expect(container.querySelectorAll(".now-line").length).toBe(0);
    expect(container.querySelectorAll(".now-pill").length).toBe(0);
  });
});

describe("ScheduleView.updateNow", () => {
  it("moves the Now line without rebuilding panes or touching scroll", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    daysEl().scrollLeft = 640;
    const firstPane = daysEl().children[0];

    view.updateNow(620);

    const line = container.querySelector(".now-line") as HTMLElement;
    expect(line.style.top).toBe("40px"); // (620 − 600) × 2
    expect(daysEl().children[0]).toBe(firstPane); // same node — no rebuild
    expect(daysEl().scrollLeft).toBe(640); // an in-progress swipe is untouched
  });

  it("removes the Now line when the envelope closes", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: 620 });
    view.updateNow(null);
    expect(container.querySelectorAll(".now-line").length).toBe(0);
    expect(container.querySelectorAll(".now-pill").length).toBe(0);
  });
});

describe("ScheduleView.onActiveDayChange", () => {
  it("fires with the first day once width is known", () => {
    const cb = vi.fn();
    const view = makeView(schedule, cb);
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    // Renormalise active day once the inner days layer has a width.
    daysEl().dispatchEvent(new Event("scroll"));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]?.[0]?.date).toBe("2026-08-11");
  });

  it("does not fire when the active index has not changed", () => {
    const cb = vi.fn();
    const view = makeView(schedule, cb);
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    daysEl().dispatchEvent(new Event("scroll"));
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    daysEl().dispatchEvent(new Event("scroll"));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not fire while clientWidth is 0 (layout not settled)", () => {
    const cb = vi.fn();
    const view = makeView(schedule, cb);
    view.render({ visibleStages: stages, nowMin: null });
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("ScheduleView.scrollToTodayAndNow", () => {
  it("swipes the .days layer to the matching festival-day pane", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    view.scrollToTodayAndNow("2026-08-14", null);
    expect(daysEl().scrollLeft).toBe(960); // idx 3 × 320
  });

  it("lands on the configured fallback pane when the caller passes it", () => {
    // Off-festival, main passes the fallback day (2026-08-12) — pane index 1,
    // not the sparse Tuesday at index 0 (ADR-0008).
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    view.scrollToTodayAndNow("2026-08-12", null);
    expect(daysEl().scrollLeft).toBe(320);
  });

  it("leaves scrollLeft alone when no target day is passed", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    widen(daysEl(), 320);
    view.scrollToTodayAndNow(null, null);
    expect(daysEl().scrollLeft).toBe(0);
  });

  it("centres the schedule container on the Now line when nowMin is in view", () => {
    // Wider origin so nowTopPx is deep enough to require non-zero scroll.
    const wideOrigin = { startMin: 600, endMin: 1440 };
    const view = createScheduleView({
      container,
      schedule,
      origin: wideOrigin,
      pxPerMinute: 2,
      onActiveDayChange: () => {},
    });
    view.render({ visibleStages: stages, nowMin: 900 });
    widen(container, 320, 400);
    // nowTopPx = (900 - 600) * 2 = 600. viewport = 400.
    // target = max(0, 600 - 200) = 400. Single schedule scrollTop, not per-pane.
    view.scrollToTodayAndNow(null, 900);
    expect(container.scrollTop).toBe(400);
  });

  it("does not touch scrollTop when nowMin is null", () => {
    const view = makeView();
    view.render({ visibleStages: stages, nowMin: null });
    widen(container, 320, 400);
    Object.defineProperty(container, "scrollTop", {
      value: 42,
      writable: true,
      configurable: true,
    });
    view.scrollToTodayAndNow("2026-08-11", null);
    expect(container.scrollTop).toBe(42);
  });
});
