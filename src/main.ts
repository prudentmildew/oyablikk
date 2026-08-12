import { registerSW } from "virtual:pwa-register";
import scheduleData from "../data/schedule.json";
import { FALLBACK_DAY } from "../scripts/edition-config.ts";
import { loadFavourites, toggleFavourite } from "./favourites.ts";
import { heartSvg } from "./heart.ts";
import {
  type BeforeInstallPromptEvent,
  decideInstallPrompt,
  type InstallContext,
  isInstallDecisionPendingOnEvent,
  isReturnVisit,
  recordFirstVisit,
  recordInstallPromptShown,
  wasInstallPromptShown,
} from "./install-detection.ts";
import { createInstallSheet, type InstallSheet } from "./install-sheet.ts";
import { sharedOrigin } from "./layout.ts";
import { dayStanding, osloMinutes, type ScheduleStanding, todayFestivalDate } from "./now.ts";
import type { Day, Schedule } from "./schedule.ts";
import { createScheduleView } from "./schedule-view.ts";
import { createSettingsSheet } from "./settings-sheet.ts";
import { loadHiddenStages, saveHiddenStages, visibleStages } from "./stage-filter.ts";
import { hasSwiped, recordSwiped, shouldPlayNudge } from "./swipe-nudge.ts";

const PX_PER_MINUTE = 2;
const TICK_MS = 60_000;

const schedule = scheduleData as Schedule;
const festivalDates = schedule.days.map((d) => d.date);
const origin = sharedOrigin(schedule);

let nowMin: number | null = null;
refreshNow();

function refreshNow(): void {
  // Now line is a pure time-of-day marker; hidden outside the shared envelope
  // (ADR-0008). When hidden, scroll-to-now is also a no-op.
  const m = osloMinutes(new Date());
  nowMin = m >= origin.startMin && m <= origin.endMin ? m : null;
}

const storage = window.localStorage;

// Install prompt state (ADR-0014). The beforeinstallprompt event is stashed
// when Chromium fires it; the sheet opens at most once, after first paint.
recordFirstVisit(storage, new Date());
let deferredInstallEvent: BeforeInstallPromptEvent | null = null;
let firstPaintReady = false;
let installSheet: InstallSheet | null = null;

// Already installed if running standalone, or iOS' non-standard flag. Suppresses
// both the sheet and the About-page fallback.
function isAppInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Snapshot of the live install context — shared by the show decision and the
// nudge's "is a sheet still coming?" gate so they read identical inputs.
function installContext(): InstallContext {
  const now = new Date();
  return {
    now,
    userAgent: navigator.userAgent,
    isStandalone: isAppInstalled(),
    promptAlreadyShown: wasInstallPromptShown(storage),
    isReturnVisit: isReturnVisit(storage, now),
    hasInstallEvent: deferredInstallEvent !== null,
    isTouchPrimary: window.matchMedia("(pointer: coarse)").matches,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

// How long the nudge waits for a possible late beforeinstallprompt before
// giving up and playing (ADR-0017 §5). Chromium fires the event within a beat
// of load when it fires at all; a residual event later than this is the
// documented limit of the gate, not a regression.
const INSTALL_EVENT_GRACE_MS = 1200;

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

const header = document.createElement("header");
header.className = "app-header";

const brand = document.createElement("div");
brand.className = "app-brand";

// Text mark until the visual identity lands (#6).
const logo = document.createElement("span");
logo.className = "app-logo-text";
logo.textContent = "Øyablikk";
brand.appendChild(logo);

const dayLabel = document.createElement("h1");
dayLabel.className = "app-day-label";
brand.appendChild(dayLabel);

header.appendChild(brand);

const actions = document.createElement("div");
actions.className = "app-actions";

// Focus (ADR-0021): a transient squint at my own lineup. Filled in both
// states — outline-vs-fill means "favourited" everywhere else in the app, so
// here the colour carries the state instead.
const focusButton = document.createElement("button");
focusButton.type = "button";
focusButton.className = "app-focus-button";
focusButton.setAttribute("aria-label", "Focus favourites");
focusButton.innerHTML = heartSvg(true);
actions.appendChild(focusButton);

// Never persisted: Focus is a glance, not a mode. A half-dimmed grid
// restored hours later would be the favourites-only filter ADR-0019
// rejected, just slower.
let focus = false;

function syncFocus(): void {
  // Nothing starred = nothing to focus on, and dimming everything would
  // leave an unreadable screen with no way back.
  focusButton.disabled = favourites.size === 0;
  focusButton.setAttribute("aria-pressed", String(focus));
  scheduleEl.classList.toggle("focus", focus);
}

focusButton.addEventListener("click", () => {
  focus = !focus;
  syncFocus();
});

const settingsButton = document.createElement("button");
settingsButton.type = "button";
settingsButton.className = "app-settings-button";
settingsButton.setAttribute("aria-label", "Settings");
settingsButton.innerHTML = `
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
`;
actions.appendChild(settingsButton);
header.appendChild(actions);

const scheduleEl = document.createElement("main");

function formatDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// Day standing (ADR-0022). "none" whenever no pane is today — true for all but
// the festival days, and the state in which the whole feature lies dormant.
function paneStanding(isoDate: string): ScheduleStanding {
  const now = new Date();
  if (todayFestivalDate(festivalDates, now) === null) return "none";
  return dayStanding(isoDate, now);
}

// The date whose pane is in view. Tracked so the minute tick can refresh the
// standing across a midnight rollover without a swipe.
let activeDate: string;

// The header is the always-on carrier of today-ness (ADR-0022): the Now line
// is hidden outside the programme envelope, i.e. most of the clock, including
// the mornings people open the app to plan.
//
//   today        — a filled accent chip reading TODAY, the NOW pill's sibling.
//                  The date itself yields the space; no header row fits both.
//   past/future  — the date, as a button back to today.
//   none         — the date, inert.
function renderDayLabel(isoDate: string): void {
  const standing = paneStanding(isoDate);
  dayLabel.replaceChildren();
  dayLabel.removeAttribute("aria-current");

  if (standing === "today") {
    dayLabel.setAttribute("aria-current", "date");
    const chip = document.createElement("span");
    chip.className = "app-today-chip";
    chip.textContent = "Today";
    dayLabel.appendChild(chip);
    return;
  }

  const text = formatDayLabel(isoDate);
  if (standing === "none") {
    dayLabel.textContent = text;
    return;
  }

  // Today is always reachable but never adjacent — without this the only way
  // home is to swipe back the way you came, counting panes.
  const back = document.createElement("button");
  back.type = "button";
  back.className = "app-today-button";
  back.setAttribute("aria-label", "Back to today");
  // Inline SVG, not "←": the self-hosted Oswald is a latin subset (ADR-0011),
  // so an arrows-block character would fall through to a system font and sit
  // at the wrong weight beside the date. Same reason the heart is drawn.
  const arrow = document.createElement("span");
  arrow.className = "app-today-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
    </svg>
  `;
  back.append(arrow, document.createTextNode(text));
  back.addEventListener("click", goToToday);
  dayLabel.appendChild(back);
}

// Set for the duration of a jump so the day change it causes is not mistaken
// for a swipe (ADR-0017 §3). The jump is instant, so this stays synchronous:
// the scroll event that lands afterwards finds the pane index unchanged and
// never reaches the flag.
let programmaticJump = false;

function goToToday(): void {
  const today = todayFestivalDate(festivalDates, new Date());
  if (today === null) return;
  programmaticJump = true;
  // Restores the launch view, vertical scroll-to-now included — an explicit
  // tap is the user asking for it, which is the exemption ADR-0022 carves out
  // of ADR-0008's once-per-session rule.
  view.scrollToTodayAndNow(today, nowMin);
  programmaticJump = false;
}

// Stale stars self-heal against the current programme (ADR-0019).
const programmeActIds = new Set(
  schedule.days.flatMap((d) => Object.values(d.acts).flat()).map((a) => a.id),
);
const favourites = loadFavourites(programmeActIds);

// Flips true once the launch sequence has settled (launch-pane jump, scroll to
// now, nudge kicked off).
let launchSettled = false;

const view = createScheduleView({
  container: scheduleEl,
  schedule,
  origin,
  pxPerMinute: PX_PER_MINUTE,
  onActiveDayChange: (day: Day) => {
    activeDate = day.date;
    renderDayLabel(day.date);
    view.setNowStanding(paneStanding(day.date));
    // Until the launch sequence settles, Day changes are programmatic. After
    // it, a Day change is a genuine user swipe and retires the nudge for good
    // (ADR-0017 §3); the nudge springs back to the same pane, so it never
    // trips this itself, and neither does the back-to-today jump.
    if (launchSettled && !programmaticJump && !hasSwiped(storage)) recordSwiped(storage);
  },
  onActTap: (actId) => {
    // The state flip is the feedback (ADR-0019) — instant repaint, no toast.
    toggleFavourite(favourites, actId);
    // Unstarring the last favourite in Focus would dim every act and disable
    // the way back out. Drop out of Focus instead (ADR-0021).
    if (favourites.size === 0) focus = false;
    syncFocus();
    paint();
  },
});

let hiddenStages = loadHiddenStages();

function paint(): void {
  view.render({
    visibleStages: visibleStages(schedule.stages, hiddenStages),
    nowMin,
    favourites,
  });
}

const settingsSheet = createSettingsSheet({
  stages: schedule.stages,
  hidden: hiddenStages,
  isInstalled: isAppInstalled(),
  onChange: (hidden) => {
    hiddenStages = new Set(hidden);
    saveHiddenStages(hiddenStages);
    paint();
  },
});
settingsButton.addEventListener("click", settingsSheet.open);

// Today's pane during the festival, the first full day otherwise (ADR-0008).
const launchDate = todayFestivalDate(festivalDates, new Date()) ?? FALLBACK_DAY;

// Seed the label and standing for the path where layout has no width yet —
// notifyActiveDay is a no-op at zero width, so nothing else would set them.
activeDate = launchDate;
renderDayLabel(launchDate);

app.append(header, scheduleEl, settingsSheet.element);
paint();
view.setNowStanding(paneStanding(launchDate));
syncFocus();

// Jump to the launch pane immediately — in a real browser the container has
// width right after append, and waiting a frame would let notifyActiveDay
// flash pane 0 (the sparse Tuesday) into the day label first.
view.scrollToTodayAndNow(launchDate, nowMin);

// One-shot scroll again once layout has settled, for the path where width was
// still 0 above (ADR-0008). Subsequent navigation does not re-scroll. A second
// frame lets that scroll paint before the install sheet may slide up, so the
// now-reader's launch moment is never covered (ADR-0008, ADR-0014).
requestAnimationFrame(() => {
  view.scrollToTodayAndNow(launchDate, nowMin);
  requestAnimationFrame(() => {
    firstPaintReady = true;
    tryShowInstallPrompt();
    maybeNudge();
    launchSettled = true;
  });
});

// Play the swipe nudge once the launch moment has settled, gated on the user
// not having swiped and not having asked to suppress motion (ADR-0017). Runs
// after tryShowInstallPrompt, so `installSheet` is already set when the sheet
// took the launch moment — the nudge then resumes on the next sheet-free
// launch (if still unswiped).
function playNudgeIfEligible(): void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (
    !shouldPlayNudge({
      hasSwiped: hasSwiped(storage),
      reducedMotion,
      installSheetShowing: installSheet !== null,
    })
  )
    return;
  view.nudge();
}

function maybeNudge(): void {
  // On Android the install decision can still be pending here — Chromium often
  // fires beforeinstallprompt after first paint. Playing now would let the
  // sheet chase the nudge moments later, the competition ADR-0017 §5 forbids.
  // So hold for a grace window and re-check: if the sheet opened, the gate
  // suppresses the nudge; if no event came, it plays. iOS and already-stashed
  // cases resolve synchronously.
  if (installSheet === null && isInstallDecisionPendingOnEvent(installContext())) {
    window.setTimeout(playNudgeIfEligible, INSTALL_EVENT_GRACE_MS);
    return;
  }
  playNudgeIfEligible();
}

// Stash Chromium's install event so the Android sheet can trigger it, and
// preventDefault so the browser's own mini-infobar yields to our sheet. May
// fire before or after first paint; tryShowInstallPrompt is idempotent and
// guarded on firstPaintReady, so calling it from both places is safe.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallEvent = e as BeforeInstallPromptEvent;
  tryShowInstallPrompt();
});

// Open the install sheet at most once per session, only after first paint and
// only when the heuristics say so (ADR-0014). Showing it burns the persisted
// one-shot immediately, however the user then dismisses it.
function tryShowInstallPrompt(): void {
  if (!app || installSheet || !firstPaintReady) return;

  const decision = decideInstallPrompt(installContext());
  if (!decision.show) return;

  installSheet = createInstallSheet({
    platform: decision.platform,
    onInstall: () => {
      void deferredInstallEvent?.prompt();
    },
  });
  app.append(installSheet.element);
  recordInstallPromptShown(storage);
  installSheet.open();
}

setInterval(() => {
  refreshNow();
  // Only the NOW line moves on the tick (ADR-0008) — a full re-render would
  // rebuild every pane and snap a mid-swipe gesture back to the nearest pane.
  view.updateNow(nowMin);
  // Standing is a calendar fact, so it can change with no swipe at all: an app
  // left open past midnight Oslo wakes on a pane that is no longer today.
  renderDayLabel(activeDate);
  view.setNowStanding(paneStanding(activeDate));
}, TICK_MS);

// Register the service worker so the app works offline in Tøyenparken
// (ADR-0013). Silent by design: no onNeedRefresh handler, so a freshly
// deployed bundle waits and activates on the next cold launch rather than
// reloading mid-session. A no-op where service workers are unsupported.
registerSW({ immediate: true });
