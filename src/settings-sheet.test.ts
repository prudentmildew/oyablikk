// Settings sheet: bottom-sheet overlay with the Stage filter page and the
// About page. Tested through its DOM surface — the only public interface.
import { describe, expect, it, vi } from "vitest";
import type { Stage } from "./schedule.ts";
import { createSettingsSheet } from "./settings-sheet.ts";

const stage = (id: string, name: string): Stage => ({
  id,
  name,
  color: "#000",
  textColor: "#fff",
});

const STAGES = [
  stage("amfiet", "Amfiet"),
  stage("sirkus", "Sirkus"),
  stage("vindfruen", "Vindfruen"),
  stage("hagen", "Hagen"),
  stage("klubben", "Klubben"),
  stage("trekanten", "Trekanten"),
];

function mount(onChange = vi.fn(), isInstalled = false) {
  document.body.replaceChildren();
  const sheet = createSettingsSheet({
    stages: STAGES,
    hidden: new Set(["hagen", "klubben", "trekanten"]),
    onChange,
    isInstalled,
  });
  document.body.appendChild(sheet.element);
  return { sheet, onChange };
}

describe("stage filter checkboxes", () => {
  it("lists every Stage in display order — hidden ones visible but unchecked", () => {
    mount();
    const boxes = [
      ...document.querySelectorAll<HTMLInputElement>(".stage-filter input[type=checkbox]"),
    ];
    expect(boxes.map((b) => b.value)).toEqual([
      "amfiet",
      "sirkus",
      "vindfruen",
      "hagen",
      "klubben",
      "trekanten",
    ]);
    expect(boxes.map((b) => b.checked)).toEqual([true, true, true, false, false, false]);
  });

  it("reports the new hidden set when a Stage is toggled on, then off again", () => {
    const { onChange } = mount();
    const trekanten = document.querySelector<HTMLInputElement>(
      '.stage-filter input[value="trekanten"]',
    ) as HTMLInputElement;

    trekanten.click();
    expect(onChange).toHaveBeenLastCalledWith(new Set(["hagen", "klubben"]));

    trekanten.click();
    expect(onChange).toHaveBeenLastCalledWith(new Set(["hagen", "klubben", "trekanten"]));
  });
});

describe("open and dismiss", () => {
  it("starts closed and opens on demand", () => {
    const { sheet } = mount();
    const backdrop = document.querySelector(".sheet-backdrop") as HTMLElement;
    expect(backdrop.hidden).toBe(true);
    sheet.open();
    expect(backdrop.hidden).toBe(false);
  });

  it("dismisses on backdrop tap but not on taps inside the sheet", () => {
    const { sheet } = mount();
    const backdrop = document.querySelector(".sheet-backdrop") as HTMLElement;
    sheet.open();

    (document.querySelector(".sheet") as HTMLElement).click();
    expect(backdrop.hidden).toBe(false);

    backdrop.click();
    expect(backdrop.hidden).toBe(true);
  });

  it("dismisses via the close affordance", () => {
    const { sheet } = mount();
    sheet.open();
    (document.querySelector(".sheet-close") as HTMLElement).click();
    expect((document.querySelector(".sheet-backdrop") as HTMLElement).hidden).toBe(true);
  });
});

describe("About page", () => {
  const settingsPage = () => document.querySelector(".sheet-page-settings") as HTMLElement;
  const aboutPage = () => document.querySelector(".sheet-page-about") as HTMLElement;
  const aboutLink = () => document.querySelector(".about-link") as HTMLElement;

  it("swaps from Settings to About and back within the sheet", () => {
    const { sheet } = mount();
    sheet.open();
    expect(settingsPage().hidden).toBe(false);
    expect(aboutPage().hidden).toBe(true);

    aboutLink().click();
    expect(settingsPage().hidden).toBe(true);
    expect(aboutPage().hidden).toBe(false);

    (document.querySelector(".about-back") as HTMLElement).click();
    expect(settingsPage().hidden).toBe(false);
    expect(aboutPage().hidden).toBe(true);
  });

  it("holds the disclaimer, the privacy statement, and install instructions", () => {
    mount();
    const text = aboutPage().textContent ?? "";
    expect(text).toContain("unaffiliated fan project");
    expect(text).toContain("localStorage");
    expect(text).toContain("Cloudflare Web Analytics");
    expect(text.toLowerCase()).toContain("add to home screen");
  });

  it("drops the install fallback once the app is installed (ADR-0014)", () => {
    mount(vi.fn(), true);
    expect(aboutPage().querySelector(".about-install")).toBeNull();
    // The rest of the page is untouched — only the instructions go.
    expect(aboutPage().textContent).toContain("unaffiliated fan project");
  });

  it("reopens on the Settings page after being closed while on About", () => {
    const { sheet } = mount();
    sheet.open();
    aboutLink().click();
    sheet.close();
    sheet.open();
    expect(settingsPage().hidden).toBe(false);
    expect(aboutPage().hidden).toBe(true);
  });
});
