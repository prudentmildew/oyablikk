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

  it("renders all six stage columns in each pane until the filter lands", () => {
    expect(document.querySelectorAll(".stage-row .stage-label").length).toBe(6);
    const firstPane = document.querySelector(".day") as HTMLElement;
    expect(firstPane.querySelectorAll(".column").length).toBe(6);
  });

  it("renders the full programme: 82 act blocks across the five panes", () => {
    const acts = document.querySelectorAll(".act");
    expect(acts.length).toBe(82);
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
