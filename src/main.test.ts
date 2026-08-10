// Boot smoke test: import main.ts against a FROZEN fixture schedule and
// assert the launch-time DOM. Runs in the global happy-dom environment.
//
// Deliberately not the committed data/schedule.json: the nightly refresh
// (ADR-0020) rewrites that file from the content lake and then deploys, so
// exact-count assertions against it turn a legitimate programme change into
// a red deploy. The fixture pins the numbers; src/schedule-data.test.ts
// keeps the real file honest on shape.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../data/schedule.json", async () => ({
  default: (await import("./fixtures/schedule.fixture.json")).default,
}));

beforeAll(async () => {
  // Off-festival instant → the launch pane must be the configured fallback
  // (Wednesday 12 August), the first full programme day (ADR-0008).
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");
});

describe("app boot (fixture schedule)", () => {
  it("renders the header with the brand mark and the fallback day label", () => {
    expect(document.querySelector(".app-logo-text")?.textContent).toBe("Øyablikk");
    expect(document.querySelector(".app-day-label")?.textContent).toBe("Wed 12 Aug");
    expect(document.querySelector(".app-settings-button")).not.toBeNull();
  });

  it("mounts one pane per programme day — three in the fixture", () => {
    expect(document.querySelectorAll(".days .day").length).toBe(3);
  });

  it("shows exactly the default-visible Stages on fresh localStorage", () => {
    const labels = [...document.querySelectorAll(".stage-row .stage-label")];
    expect(labels.map((l) => l.textContent)).toEqual([
      "Amfiet",
      "Sirkus",
      "Vindfruen",
      "Hagen",
      "Klubben",
    ]);
    const firstPane = document.querySelector(".day") as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(5);
  });

  it("renders the default-visible programme: 21 act blocks across the three panes", () => {
    // 1 (sparse Tuesday) + 10 + 10, i.e. every fixture act except the ones on
    // the two default-hidden Stages.
    const acts = document.querySelectorAll(".act");
    expect(acts.length).toBe(21);
    // Every act block carries its stable act id (the Favourites hook).
    for (const act of acts) {
      expect((act as HTMLElement).dataset.actId).toBeTruthy();
    }
  });

  it("hides the NOW line at 12:00 Oslo — outside the fixture envelope", () => {
    // The fixture envelope is 13:00–23:00 Oslo, so noon is outside it and the
    // line must be absent (ADR-0008).
    expect(document.querySelectorAll(".now-line").length).toBe(0);
  });
});

describe("stage filter (through the Settings sheet)", () => {
  it("opens the Settings sheet from the header gear", () => {
    (document.querySelector(".app-settings-button") as HTMLElement).click();
    expect((document.querySelector(".sheet-backdrop") as HTMLElement).hidden).toBe(false);
  });

  it("toggling Biblioteket on reveals its column and the Wednesday talk", () => {
    // Exact-match on the column contents is safe here: the fixture is frozen,
    // so only a real regression in the Stage filter can change it.
    const biblioteket = document.querySelector(
      '.stage-filter input[value="biblioteket"]',
    ) as HTMLInputElement;
    biblioteket.click();

    const labels = [...document.querySelectorAll(".stage-row .stage-label")];
    expect(labels.map((l) => l.textContent)).toEqual([
      "Amfiet",
      "Sirkus",
      "Vindfruen",
      "Hagen",
      "Klubben",
      "Biblioteket",
    ]);

    const wednesday = document.querySelector('[data-day-date="2026-08-12"]') as HTMLElement;
    const names = [...wednesday.querySelectorAll(".column")].at(-1)?.querySelectorAll(".act-name");
    expect([...(names ?? [])].map((n) => n.textContent)).toEqual(["Fixture Podcast Panel"]);
  });

  it("persists the shrunken hidden set under the oya.* key", () => {
    expect(JSON.parse(localStorage.getItem("oya.hiddenStages") ?? "[]").sort()).toEqual([
      "trekanten",
    ]);
  });

  it("toggling Biblioteket off re-flows back to five columns", () => {
    const biblioteket = document.querySelector(
      '.stage-filter input[value="biblioteket"]',
    ) as HTMLInputElement;
    biblioteket.click();

    expect(document.querySelectorAll(".stage-row .stage-label").length).toBe(5);
    const firstPane = document.querySelector(".day") as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(5);
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
    expect(starredEl.querySelector(".act-heart svg")?.getAttribute("fill")).toBe("currentColor");
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
