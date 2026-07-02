// Boot smoke test: import main.ts against the real committed schedule.json
// and assert the launch-time DOM. Runs in the global happy-dom environment.
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(async () => {
  // Off-festival instant → the launch pane must be the configured fallback
  // (Wednesday 12 August), not the sparse Tuesday (ADR-0008).
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");
});

describe("app boot (real schedule.json)", () => {
  it("renders the header with the brand mark and the fallback day label", () => {
    expect(document.querySelector(".app-logo-text")?.textContent).toBe("Øyablikk");
    expect(document.querySelector(".app-day-label")?.textContent).toBe("Wednesday 12 August");
    expect(document.querySelector(".app-settings-button")).not.toBeNull();
  });

  it("mounts one pane per programme day — five in 2026", () => {
    expect(document.querySelectorAll(".days .day").length).toBe(5);
  });

  it("shows exactly the default-visible Stages on fresh localStorage", () => {
    const labels = [...document.querySelectorAll(".stage-row .stage-label")];
    expect(labels.map((l) => l.textContent)).toEqual(["Amfiet", "Sirkus", "Vindfruen"]);
    const firstPane = document.querySelector(".day") as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(3);
  });

  it("renders the default-visible programme: 49 act blocks across the five panes", () => {
    const acts = document.querySelectorAll(".act");
    expect(acts.length).toBe(49);
    // Every act block carries its stable act id (the Favourites hook).
    for (const act of acts) {
      expect((act as HTMLElement).dataset.actId).toBeTruthy();
    }
  });

  it("hides the NOW line at 12:00 Oslo — outside the 2026 envelope", () => {
    // The 2026 envelope is 13:00–23:00 Oslo, so noon is outside it and the
    // line must be absent (ADR-0008).
    expect(document.querySelectorAll(".now-line").length).toBe(0);
  });
});

describe("stage filter (through the Settings sheet)", () => {
  it("opens the Settings sheet from the header gear", () => {
    (document.querySelector(".app-settings-button") as HTMLElement).click();
    expect((document.querySelector(".sheet-backdrop") as HTMLElement).hidden).toBe(false);
  });

  it("toggling Trekanten on reveals its column and the Tuesday opening act", () => {
    const trekanten = document.querySelector(
      '.stage-filter input[value="trekanten"]',
    ) as HTMLInputElement;
    trekanten.click();

    const labels = [...document.querySelectorAll(".stage-row .stage-label")];
    expect(labels.map((l) => l.textContent)).toEqual([
      "Amfiet",
      "Sirkus",
      "Vindfruen",
      "Trekanten",
    ]);

    const tuesday = document.querySelector('[data-day-date="2026-08-11"]') as HTMLElement;
    const names = [...tuesday.querySelectorAll(".act-name")].map((n) => n.textContent);
    expect(names).toEqual(["Karl Hjalmar Nyberg"]);
  });

  it("persists the shrunken hidden set under the oya.* key", () => {
    expect(JSON.parse(localStorage.getItem("oya.hiddenStages") ?? "[]").sort()).toEqual([
      "hagen",
      "klubben",
    ]);
  });

  it("toggling Trekanten off re-flows back to three columns", () => {
    const trekanten = document.querySelector(
      '.stage-filter input[value="trekanten"]',
    ) as HTMLInputElement;
    trekanten.click();

    expect(document.querySelectorAll(".stage-row .stage-label").length).toBe(3);
    const firstPane = document.querySelector(".day") as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(3);
  });
});

describe("favourites (tap-to-star, ADR-0019)", () => {
  function tap(el: HTMLElement): void {
    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, clientY: 100, bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 50, clientY: 100, bubbles: true }));
  }

  it("starts with nothing starred", () => {
    expect(document.querySelectorAll(".act.starred").length).toBe(0);
  });

  it("tapping an act stars it in place and persists under oya.favourites", () => {
    const actEl = document.querySelector(".act") as HTMLElement;
    const actId = actEl.dataset.actId as string;
    tap(actEl);

    const starredEl = document.querySelector(".act.starred") as HTMLElement;
    expect(starredEl).not.toBeNull();
    expect(starredEl.dataset.actId).toBe(actId);
    expect(starredEl.querySelector(".act-star")).not.toBeNull();
    expect(JSON.parse(localStorage.getItem("oya.favourites") ?? "[]")).toEqual([actId]);
  });

  it("tapping the starred act again unstars it and empties the store", () => {
    const starredEl = document.querySelector(".act.starred") as HTMLElement;
    tap(starredEl);

    expect(document.querySelectorAll(".act.starred").length).toBe(0);
    expect(JSON.parse(localStorage.getItem("oya.favourites") ?? "[]")).toEqual([]);
  });

  it("scrolling over an act block does not toggle it", () => {
    const actEl = document.querySelector(".act") as HTMLElement;
    actEl.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 50, clientY: 100, bubbles: true }),
    );
    actEl.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 50, clientY: 300, bubbles: true }),
    );
    expect(document.querySelectorAll(".act.starred").length).toBe(0);
  });
});
