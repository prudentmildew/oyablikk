import { describe, expect, it } from "vitest";
import {
  INSTALL_CUTOFF_ISO,
  type InstallContext,
  decideInstallPrompt,
  detectInstallPlatform,
  isInstallDecisionPendingOnEvent,
  isPastInstallCutoff,
  isReturnVisit,
  recordFirstVisit,
  recordInstallPromptShown,
  wasInstallPromptShown,
} from "./install-detection.ts";

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

// Representative modern UA strings — only the distinguishing tokens matter.
const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  ipadSafari:
    "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  // iPadOS 13+ Safari's real default UA: a desktop "Macintosh" string with no
  // "iPad" token. Distinguished from a real Mac only by maxTouchPoints > 1.
  ipadOSDesktopSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  desktopSafariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/604.1",
  iphoneEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 EdgiOS/124.0.2478.50 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
  desktopChromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Safari/537.36",
};

describe("recordFirstVisit", () => {
  it("stores the Oslo date under the first-visit key when absent", () => {
    const storage = makeStorage();
    // UTC 10:00 on 12 August = Oslo 12:00 on 12 August
    recordFirstVisit(storage, new Date("2026-08-12T10:00:00Z"));
    expect(storage.getItem("oya.firstVisitDate")).toBe("2026-08-12");
  });

  it("does NOT overwrite an existing first-visit date on a later day", () => {
    const storage = makeStorage();
    recordFirstVisit(storage, new Date("2026-08-12T10:00:00Z"));
    recordFirstVisit(storage, new Date("2026-08-13T10:00:00Z"));
    expect(storage.getItem("oya.firstVisitDate")).toBe("2026-08-12");
  });
});

describe("isReturnVisit", () => {
  it("is false when nothing is stored", () => {
    expect(isReturnVisit(makeStorage(), new Date("2026-08-13T10:00:00Z"))).toBe(false);
  });

  it("is false on the same Oslo calendar day, even at a different UTC instant", () => {
    const storage = makeStorage();
    recordFirstVisit(storage, new Date("2026-08-12T08:00:00Z")); // Oslo 12th
    // UTC 21:59 on the 12th = Oslo 23:59 on the 12th — still day 1.
    expect(isReturnVisit(storage, new Date("2026-08-12T21:59:00Z"))).toBe(false);
  });

  it("is true once the Oslo calendar day has advanced past the stored day", () => {
    const storage = makeStorage();
    recordFirstVisit(storage, new Date("2026-08-12T08:00:00Z")); // Oslo 12th
    // UTC 22:30 on the 12th = Oslo 00:30 on the 13th — return visit.
    expect(isReturnVisit(storage, new Date("2026-08-12T22:30:00Z"))).toBe(true);
  });

  it("is true when the stored date is an earlier Oslo day", () => {
    const storage = makeStorage();
    storage.setItem("oya.firstVisitDate", "2026-08-12");
    expect(isReturnVisit(storage, new Date("2026-08-14T10:00:00Z"))).toBe(true);
  });
});

describe("isPastInstallCutoff", () => {
  it("is false at Oslo 2026-08-15T23:59 (last festival night)", () => {
    expect(isPastInstallCutoff(new Date("2026-08-15T21:59:00Z"))).toBe(false);
  });

  it("is true exactly at the cutoff instant", () => {
    expect(isPastInstallCutoff(new Date(INSTALL_CUTOFF_ISO))).toBe(true);
  });

  it("is true after the cutoff", () => {
    expect(isPastInstallCutoff(new Date("2026-08-16T10:00:00Z"))).toBe(true);
  });

  it("is false well before the festival", () => {
    expect(isPastInstallCutoff(new Date("2026-07-01T10:00:00Z"))).toBe(false);
  });
});

describe("recordInstallPromptShown / wasInstallPromptShown", () => {
  it("round-trips the one-shot flag", () => {
    const storage = makeStorage();
    expect(wasInstallPromptShown(storage)).toBe(false);
    recordInstallPromptShown(storage);
    expect(wasInstallPromptShown(storage)).toBe(true);
  });
});

describe("detectInstallPlatform", () => {
  it("returns ios for iPhone Safari", () => {
    expect(detectInstallPlatform({ userAgent: UA.iphoneSafari, hasInstallEvent: false })).toBe(
      "ios",
    );
  });

  it("returns ios for legacy iPad Safari (iPad token present)", () => {
    expect(detectInstallPlatform({ userAgent: UA.ipadSafari, hasInstallEvent: false })).toBe("ios");
  });

  it("returns ios for iPadOS Safari with a desktop UA when touch-capable", () => {
    expect(
      detectInstallPlatform({
        userAgent: UA.ipadOSDesktopSafari,
        hasInstallEvent: false,
        maxTouchPoints: 5,
      }),
    ).toBe("ios");
  });

  it("returns unsupported for desktop Safari on a real Mac (no touch points)", () => {
    expect(
      detectInstallPlatform({
        userAgent: UA.desktopSafariMac,
        hasInstallEvent: false,
        maxTouchPoints: 0,
      }),
    ).toBe("unsupported");
  });

  it("returns ios for iOS Safari regardless of a stashed install event", () => {
    expect(detectInstallPlatform({ userAgent: UA.iphoneSafari, hasInstallEvent: true })).toBe(
      "ios",
    );
  });

  it("returns unsupported for in-app iOS browsers (Chrome, Firefox, Edge)", () => {
    for (const ua of [UA.iphoneChrome, UA.iphoneFirefox, UA.iphoneEdge]) {
      expect(detectInstallPlatform({ userAgent: ua, hasInstallEvent: false })).toBe("unsupported");
    }
  });

  it("returns android for Android Chrome with a stashed install event", () => {
    expect(detectInstallPlatform({ userAgent: UA.androidChrome, hasInstallEvent: true })).toBe(
      "android",
    );
  });

  it("returns unsupported for Android Chrome without an install event", () => {
    expect(detectInstallPlatform({ userAgent: UA.androidChrome, hasInstallEvent: false })).toBe(
      "unsupported",
    );
  });

  it("returns android for desktop Chrome with an install event (touch guard is elsewhere)", () => {
    expect(
      detectInstallPlatform({ userAgent: UA.desktopChromeWindows, hasInstallEvent: true }),
    ).toBe("android");
  });
});

describe("decideInstallPrompt", () => {
  // A sensible "everything green for android" baseline; cases override fields.
  const base: InstallContext = {
    now: new Date("2026-08-13T10:00:00Z"),
    userAgent: UA.androidChrome,
    isStandalone: false,
    promptAlreadyShown: false,
    isReturnVisit: true,
    hasInstallEvent: true,
    isTouchPrimary: true,
    maxTouchPoints: 5,
  };

  it("does not show when already installed (standalone)", () => {
    expect(decideInstallPrompt({ ...base, isStandalone: true })).toEqual({ show: false });
  });

  it("does not show when the one-shot flag is set", () => {
    expect(decideInstallPrompt({ ...base, promptAlreadyShown: true })).toEqual({ show: false });
  });

  it("does not show past the festival cutoff", () => {
    expect(decideInstallPrompt({ ...base, now: new Date(INSTALL_CUTOFF_ISO) })).toEqual({
      show: false,
    });
  });

  it("does not show on the first visit (not a return visit)", () => {
    expect(decideInstallPrompt({ ...base, isReturnVisit: false })).toEqual({ show: false });
  });

  it("shows the android variant for return-visit Android with touch + install event", () => {
    expect(decideInstallPrompt(base)).toEqual({ show: true, platform: "android" });
  });

  it("does not show android on a non-touch device (desktop guard)", () => {
    expect(decideInstallPrompt({ ...base, isTouchPrimary: false })).toEqual({ show: false });
  });

  it("does not show android without a stashed install event", () => {
    expect(decideInstallPrompt({ ...base, hasInstallEvent: false })).toEqual({ show: false });
  });

  it("shows the ios variant for return-visit iOS Safari", () => {
    expect(
      decideInstallPrompt({ ...base, userAgent: UA.iphoneSafari, hasInstallEvent: false }),
    ).toEqual({ show: true, platform: "ios" });
  });

  it("shows the ios variant for return-visit iPadOS Safari (desktop UA + touch)", () => {
    expect(
      decideInstallPrompt({
        ...base,
        userAgent: UA.ipadOSDesktopSafari,
        hasInstallEvent: false,
        isTouchPrimary: false, // iPad Safari reports pointer:fine, but is touch-capable
      }),
    ).toEqual({ show: true, platform: "ios" });
  });

  it("does not show on desktop Safari on a real Mac (no touch points)", () => {
    expect(
      decideInstallPrompt({
        ...base,
        userAgent: UA.desktopSafariMac,
        hasInstallEvent: false,
        isTouchPrimary: false,
        maxTouchPoints: 0,
      }),
    ).toEqual({ show: false });
  });

  it("does not show on iOS Chrome (unsupported platform)", () => {
    expect(decideInstallPrompt({ ...base, userAgent: UA.iphoneChrome })).toEqual({ show: false });
  });
});

describe("isInstallDecisionPendingOnEvent", () => {
  // Android return-visit candidate with no event stashed yet: a late
  // beforeinstallprompt would flip the decision to "show".
  const base: InstallContext = {
    now: new Date("2026-08-13T10:00:00Z"),
    userAgent: UA.androidChrome,
    isStandalone: false,
    promptAlreadyShown: false,
    isReturnVisit: true,
    hasInstallEvent: false,
    isTouchPrimary: true,
    maxTouchPoints: 5,
  };

  it("is true for an Android return-visit candidate awaiting the event", () => {
    expect(isInstallDecisionPendingOnEvent(base)).toBe(true);
  });

  it("is false once the event has already been stashed (decided)", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, hasInstallEvent: true })).toBe(false);
  });

  it('is false on iOS Safari — decided "show" without any event', () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, userAgent: UA.iphoneSafari })).toBe(false);
  });

  it("is false on a non-touch device — a later event still loses the touch guard", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, isTouchPrimary: false })).toBe(false);
  });

  it("is false on the first visit — no event would help", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, isReturnVisit: false })).toBe(false);
  });

  it("is false when already installed", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, isStandalone: true })).toBe(false);
  });

  it("is false when the one-shot is already spent", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, promptAlreadyShown: true })).toBe(false);
  });

  it("is false past the festival cutoff", () => {
    expect(isInstallDecisionPendingOnEvent({ ...base, now: new Date(INSTALL_CUTOFF_ISO) })).toBe(
      false,
    );
  });
});
