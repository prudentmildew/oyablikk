// Focus (ADR-0021): the Header heart dims unstarred acts so a favourite
// pops out of the grid. The state machine is Focus on/off × favourites
// empty/non-empty; the corner that matters is emptying the set while Focus
// is on, which would otherwise dim every act and disable the way back out.
// Separate file so main.ts boots against fresh localStorage.
import { beforeAll, describe, expect, it, vi } from "vitest";

function tap(el: HTMLElement): void {
  el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, clientY: 100, bubbles: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { clientX: 50, clientY: 100, bubbles: true }));
}

const focusButton = () => document.querySelector(".app-focus-button") as HTMLButtonElement;
const schedule = () => document.querySelector(".schedule") as HTMLElement;

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");
});

describe("Focus (ADR-0021)", () => {
  it("sits left of the gear, inert, with nothing starred", () => {
    const buttons = [...document.querySelectorAll(".app-actions button")];
    expect(buttons.map((b) => b.className)).toEqual(["app-focus-button", "app-settings-button"]);
    expect(focusButton().disabled).toBe(true);
    expect(focusButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("wakes up on the first star", () => {
    tap(document.querySelector(".act") as HTMLElement);
    expect(focusButton().disabled).toBe(false);
  });

  it("dims the unstarred acts while on, and restores them when off", () => {
    focusButton().click();
    expect(schedule().classList.contains("focus")).toBe(true);
    expect(focusButton().getAttribute("aria-pressed")).toBe("true");

    focusButton().click();
    expect(schedule().classList.contains("focus")).toBe(false);
    expect(focusButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("leaves dimmed acts tappable — Focus changes prominence, not interactivity", () => {
    focusButton().click();
    const dimmed = [...document.querySelectorAll(".act")].find(
      (el) => !el.classList.contains("starred"),
    ) as HTMLElement;
    const dimmedId = dimmed.dataset.actId as string;

    tap(dimmed);
    expect(
      (document.querySelector(`[data-act-id="${dimmedId}"]`) as HTMLElement).classList.contains(
        "starred",
      ),
    ).toBe(true);

    // Back to one favourite, Focus off, for the last-unstar case below.
    tap(document.querySelector(`[data-act-id="${dimmedId}"]`) as HTMLElement);
    focusButton().click();
  });

  it("drops out of Focus when the last favourite is unstarred", () => {
    focusButton().click();
    expect(schedule().classList.contains("focus")).toBe(true);

    // The dead screen: every act dimmed, escape hatch greyed out.
    tap(document.querySelector(".act.starred") as HTMLElement);

    expect(schedule().classList.contains("focus")).toBe(false);
    expect(focusButton().disabled).toBe(true);
    expect(focusButton().getAttribute("aria-pressed")).toBe("false");
  });
});
