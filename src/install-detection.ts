// Install-prompt heuristics (ADR-0014). Pure decisions over primitives; the
// caller owns storage and browser APIs.
import { osloDate } from "./now.ts";

export type InstallPlatform = "ios" | "android" | "unsupported";

// Minimal typing for the non-standard beforeinstallprompt event (Android/desktop
// Chromium). Not in the standard DOM lib.
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// localStorage keys (client-side only; the About privacy note depends on it).
const FIRST_VISIT_KEY = "oya.firstVisitDate"; // Oslo YYYY-MM-DD set on first run
const PROMPT_SHOWN_KEY = "oya.installPromptShown"; // set once shown (one-shot)

// Hard festival cutoff: the sheet must never fire at/after this instant.
// Øya ends 2026-08-15; this is midnight Oslo on the 16th (CEST = UTC+2).
export const INSTALL_CUTOFF_ISO = "2026-08-16T00:00:00+02:00";

const INSTALL_CUTOFF = new Date(INSTALL_CUTOFF_ISO);

// Stores the first-visit Oslo date ONLY if absent, so a later-day call cannot
// clobber it — the original day-1 value is what the return-visit signal needs.
export function recordFirstVisit(storage: Storage, now: Date): void {
  if (storage.getItem(FIRST_VISIT_KEY) === null) {
    storage.setItem(FIRST_VISIT_KEY, osloDate(now));
  }
}

// true iff a first visit is recorded AND the Oslo calendar day has since
// changed. A reload in one sitting must not count (ADR-0014: second-calendar-day
// signal), regardless of the UTC instant.
export function isReturnVisit(storage: Storage, now: Date): boolean {
  const firstVisit = storage.getItem(FIRST_VISIT_KEY);
  if (firstVisit === null) return false;
  return osloDate(now) !== firstVisit;
}

export function isPastInstallCutoff(now: Date): boolean {
  return now.getTime() >= INSTALL_CUTOFF.getTime();
}

// One-shot guard so the sheet never shows twice. The value is a presence
// marker; only its existence matters.
export function recordInstallPromptShown(storage: Storage): void {
  storage.setItem(PROMPT_SHOWN_KEY, "1");
}

export function wasInstallPromptShown(storage: Storage): boolean {
  return storage.getItem(PROMPT_SHOWN_KEY) !== null;
}

// In-app iOS browsers ride the same WebKit engine but cannot install PWAs, so
// only true iOS Safari qualifies for the "ios" variant.
const IOS_NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//;

export function detectInstallPlatform(opts: {
  userAgent: string;
  hasInstallEvent: boolean;
  maxTouchPoints?: number;
}): InstallPlatform {
  const { userAgent, hasInstallEvent, maxTouchPoints = 0 } = opts;

  // iPadOS 13+ Safari reports a desktop ("Macintosh") UA by default — the "iPad"
  // token is gone. The touch-point count is what separates it from a real Mac
  // (which reports 0), so a touch-capable Mac UA is treated as iPad (ADR-0014).
  const isIos =
    /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (isIos) {
    // iOS takes precedence (it never fires beforeinstallprompt anyway): real
    // Safari -> "ios"; any in-app browser that can't install -> "unsupported".
    return IOS_NON_SAFARI.test(userAgent) ? "unsupported" : "ios";
  }

  // Non-iOS: a stashed beforeinstallprompt means an installable Chromium. This
  // also matches desktop Chromium; the touch guard in decideInstallPrompt — not
  // here — filters that out.
  return hasInstallEvent ? "android" : "unsupported";
}

export interface InstallContext {
  now: Date;
  userAgent: string;
  isStandalone: boolean; // already installed -> never show
  promptAlreadyShown: boolean; // one-shot guard -> never show again
  isReturnVisit: boolean; // second-calendar-day signal
  hasInstallEvent: boolean;
  isTouchPrimary: boolean; // pointer:coarse (desktop guard)
  maxTouchPoints: number; // navigator.maxTouchPoints (iPadOS desktop-UA tell)
}

export type InstallDecision = { show: false } | { show: true; platform: "ios" | "android" };

export function decideInstallPrompt(ctx: InstallContext): InstallDecision {
  if (ctx.isStandalone) return { show: false };
  if (ctx.promptAlreadyShown) return { show: false }; // one-shot
  if (isPastInstallCutoff(ctx.now)) return { show: false }; // hard cutoff
  if (!ctx.isReturnVisit) return { show: false }; // first visit untouched (ADR-0008)

  const platform = detectInstallPlatform({
    userAgent: ctx.userAgent,
    hasInstallEvent: ctx.hasInstallEvent,
    maxTouchPoints: ctx.maxTouchPoints,
  });

  if (platform === "ios") return { show: true, platform: "ios" };
  if (platform === "android") {
    // Desktop guard: a stashed install event alone isn't enough — only offer
    // the sheet on a touch-primary device.
    return ctx.isTouchPrimary ? { show: true, platform: "android" } : { show: false };
  }
  return { show: false };
}

// True when the decision is currently "no" ONLY because no beforeinstallprompt
// has been stashed yet, but a late event would flip it to "show" this visit —
// the Android timing case, where Chromium fires the event after first paint.
// The launch sequence consults this to hold the swipe nudge until the install
// outcome is settled, so the nudge never plays and then gets chased by the
// sheet (ADR-0017 §5). Built on decideInstallPrompt so the gate and the real
// decision can never drift apart.
export function isInstallDecisionPendingOnEvent(ctx: InstallContext): boolean {
  if (ctx.hasInstallEvent) return false; // event already known — not pending
  if (decideInstallPrompt(ctx).show) return false; // already a "yes" (e.g. iOS)
  return decideInstallPrompt({ ...ctx, hasInstallEvent: true }).show;
}
