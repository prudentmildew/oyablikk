import scheduleData from "../data/schedule.json";
import { FALLBACK_DAY } from "../scripts/edition-config.ts";
import { loadFavourites, toggleFavourite } from "./favourites.ts";
import { heartSvg } from "./heart.ts";
import { sharedOrigin } from "./layout.ts";
import { osloMinutes, todayFestivalDate } from "./now.ts";
import { createScheduleView } from "./schedule-view.ts";
import type { Day, Schedule } from "./schedule.ts";
import { createSettingsSheet } from "./settings-sheet.ts";
import { loadHiddenStages, saveHiddenStages, visibleStages } from "./stage-filter.ts";

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
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// Stale stars self-heal against the current programme (ADR-0019).
const programmeActIds = new Set(
  schedule.days.flatMap((d) => Object.values(d.acts).flat()).map((a) => a.id),
);
const favourites = loadFavourites(programmeActIds);

const view = createScheduleView({
  container: scheduleEl,
  schedule,
  origin,
  pxPerMinute: PX_PER_MINUTE,
  onActiveDayChange: (day: Day) => {
    dayLabel.textContent = formatDayLabel(day.date);
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
  onChange: (hidden) => {
    hiddenStages = new Set(hidden);
    saveHiddenStages(hiddenStages);
    paint();
  },
});
settingsButton.addEventListener("click", settingsSheet.open);

// Today's pane during the festival, the first full day otherwise (ADR-0008).
const launchDate = todayFestivalDate(festivalDates, new Date()) ?? FALLBACK_DAY;

// Seed the label for the path where layout has no width yet.
dayLabel.textContent = formatDayLabel(launchDate);

app.append(header, scheduleEl, settingsSheet.element);
paint();
syncFocus();

// Jump to the launch pane immediately — in a real browser the container has
// width right after append, and waiting a frame would let notifyActiveDay
// flash pane 0 (the sparse Tuesday) into the day label first.
view.scrollToTodayAndNow(launchDate, nowMin);

// One-shot scroll again once layout has settled, for the path where width was
// still 0 above (ADR-0008). Subsequent navigation does not re-scroll.
requestAnimationFrame(() => {
  view.scrollToTodayAndNow(launchDate, nowMin);
});

setInterval(() => {
  refreshNow();
  // Only the NOW line moves on the tick (ADR-0008) — a full re-render would
  // rebuild every pane and snap a mid-swipe gesture back to the nearest pane.
  view.updateNow(nowMin);
}, TICK_MS);
