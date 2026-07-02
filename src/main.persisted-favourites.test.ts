// Reload persistence for Favourites (ADR-0019): stars saved on a previous
// visit survive the next boot, and a star whose act id vanished from
// schedule.json is silently dropped. Separate file so main.ts re-runs its
// import side effects against the seeded localStorage.
import { beforeAll, describe, expect, it, vi } from "vitest";
import scheduleData from "../data/schedule.json";
import type { Schedule } from "./schedule.ts";

// A real act id from the committed data — derived, not pinned, so a nightly
// programme refresh cannot break this suite (ADR-0009/0020). Drawn from
// Amfiet: a default-visible stage, so the star is on screen at boot.
const realActId = (scheduleData as Schedule).days
  .flatMap((d) => d.acts.amfiet ?? [])
  .map((a) => a.id)[0] as string;

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T10:00:00Z"));

  // One real star and one whose act no longer exists in the data.
  localStorage.setItem("oya.favourites", JSON.stringify([realActId, "gone-from-programme"]));

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  await import("./main.ts");
});

describe("app boot (persisted favourites)", () => {
  it("renders the surviving star in place and drops the stale one silently", () => {
    const starred = document.querySelectorAll(".act.starred");
    expect(starred.length).toBe(1);
    expect((starred[0] as HTMLElement).dataset.actId).toBe(realActId);
  });

  it("self-heals the store: the stale id is gone after boot", () => {
    expect(JSON.parse(localStorage.getItem("oya.favourites") ?? "[]")).toEqual([realActId]);
  });
});
