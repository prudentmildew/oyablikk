// Install sheet: the quiet one-shot bottom sheet (ADR-0014). Tested through
// its DOM surface, like the Settings sheet.
import { describe, expect, it, vi } from "vitest";
import { createInstallSheet } from "./install-sheet.ts";

describe("createInstallSheet", () => {
  it("reuses the Settings sheet shell and names itself for assistive tech", () => {
    const { element } = createInstallSheet({ platform: "ios" });
    expect(element.classList.contains("sheet-backdrop")).toBe(true);
    const sheet = element.querySelector(".sheet.install-sheet");
    expect(sheet?.getAttribute("role")).toBe("dialog");
    expect(sheet?.getAttribute("aria-label")).toBe("Add to home screen");
  });

  it("starts closed, and opens and closes by the hidden attribute", () => {
    const { element, open, close } = createInstallSheet({ platform: "ios" });
    expect(element.hidden).toBe(true);
    open();
    expect(element.hidden).toBe(false);
    close();
    expect(element.hidden).toBe(true);
  });

  it("leads with the offline-at-the-site pitch", () => {
    const { element } = createInstallSheet({ platform: "ios" });
    expect(element.querySelector(".install-title")?.textContent).toBe("Add it to your home screen");
    expect(element.querySelector(".install-subtitle")?.textContent).toContain("without signal");
  });

  it("renders the iOS Share-glyph instruction and no Install button on iOS", () => {
    const { element } = createInstallSheet({ platform: "ios" });
    const instruction = element.querySelector(".install-instruction");
    expect(instruction?.textContent).toContain("Add to Home Screen");
    expect(instruction?.querySelector("svg.install-share-glyph")).not.toBeNull();
    expect(element.querySelector(".install-button")).toBeNull();
  });

  it("renders an Install button bound to onInstall on Android", () => {
    const onInstall = vi.fn();
    const { element } = createInstallSheet({ platform: "android", onInstall });
    const button = element.querySelector(".install-button") as HTMLButtonElement;
    expect(button.textContent).toBe("Install");
    expect(element.querySelector(".install-instruction")).toBeNull();

    button.click();
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it('offers only a close X — no "not now" / "maybe later" escape hatch', () => {
    const { element, open } = createInstallSheet({ platform: "ios" });
    open();
    const text = element.textContent?.toLowerCase() ?? "";
    expect(text).not.toContain("not now");
    expect(text).not.toContain("maybe later");

    const close = element.querySelector(".sheet-close") as HTMLButtonElement;
    expect(close.getAttribute("aria-label")).toBe("Close");
    close.click();
    expect(element.hidden).toBe(true);
  });

  it("dismisses on a backdrop tap", () => {
    const { element, open } = createInstallSheet({ platform: "ios" });
    open();
    element.click();
    expect(element.hidden).toBe(true);
  });
});
