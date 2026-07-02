import { renderDay } from "./day-pane.ts";
import { type TimeOrigin, pxFromMin } from "./layout.ts";
import type { Day, Schedule, Stage } from "./schedule.ts";

export type ScheduleViewOptions = {
  container: HTMLElement;
  schedule: Schedule;
  origin: TimeOrigin;
  pxPerMinute: number;
  onActiveDayChange: (day: Day) => void;
  /** Fires on a clean tap on an act block — never on a scroll (ADR-0019). */
  onActTap?: (actId: string) => void;
};

// A tap and a scroll start identically; the pointer's travel between down
// and up is what tells them apart. Kept generous — a fingertip wobbles.
const TAP_SLOP_PX = 10;

// A touch landing this soon after a scroll event is arresting a fling, not
// starring an act. Momentum scroll emits events every frame (~15 ms apart,
// measured) right up to the touch, while a deliberate scroll-then-tap has a
// human-scale gap (>100 ms) — 50 ms splits the two with margin both ways.
const SCROLL_QUIET_MS = 50;

export type RenderState = {
  visibleStages: Stage[];
  nowMin: number | null;
  /** Starred act ids (ADR-0019). Omitted = nothing starred. */
  favourites?: ReadonlySet<string>;
};

export type ScheduleView = {
  render(state: RenderState): void;
  /** Repositions just the Now line — the 60 s tick must not rebuild panes. */
  updateNow(nowMin: number | null): void;
  scrollToTodayAndNow(todayIso: string | null, nowMin: number | null): void;
};

export function createScheduleView(opts: ScheduleViewOptions): ScheduleView {
  const { container, schedule, origin, pxPerMinute, onActiveDayChange, onActTap } = opts;

  container.classList.add("schedule");

  // Persistent chrome (ADR-0012): built once, mutated on render. The pane
  // count is data-driven — one per Day in the Schedule, never hardcoded.
  const stageRow = document.createElement("div");
  stageRow.className = "stage-row";

  const rail = document.createElement("div");
  rail.className = "rail";
  buildRail(rail, origin, pxPerMinute);

  const daysEl = document.createElement("div");
  daysEl.className = "days";

  container.append(stageRow, rail, daysEl);

  let lastActiveIdx = -1;
  let nowLine: HTMLElement | null = null;
  let nowPill: HTMLElement | null = null;

  function renderNow(nowMin: number | null): void {
    nowLine?.remove();
    nowPill?.remove();
    nowLine = null;
    nowPill = null;
    if (nowMin === null) return;

    const top = `${pxFromMin(nowMin, origin, pxPerMinute)}px`;
    nowLine = document.createElement("div");
    nowLine.className = "now-line";
    nowLine.style.top = top;
    nowPill = document.createElement("div");
    nowPill.className = "now-pill";
    nowPill.style.top = top;
    nowPill.textContent = "NOW";
    container.append(nowLine, nowPill);
  }

  function notifyActiveDay(): void {
    const width = daysEl.clientWidth;
    if (width === 0) return;
    const idx = Math.max(
      0,
      Math.min(Math.round(daysEl.scrollLeft / width), schedule.days.length - 1),
    );
    if (idx === lastActiveIdx) return;
    lastActiveIdx = idx;
    const day = schedule.days[idx];
    if (day) onActiveDayChange(day);
  }

  function render(state: RenderState): void {
    const width = daysEl.clientWidth;
    const activeIdx = width > 0 ? Math.round(daysEl.scrollLeft / width) : 0;

    // One source for the shared grid template (ADR-0012): the Stage row and
    // every pane's act grid inherit the same column count from the container.
    container.style.setProperty("--column-count", String(state.visibleStages.length));
    renderStageRow(stageRow, state.visibleStages);
    renderNow(state.nowMin);

    daysEl.replaceChildren();
    for (const day of schedule.days) {
      const pane = renderDay({
        day,
        visibleStages: state.visibleStages,
        origin,
        pxPerMinute,
        favourites: state.favourites,
      });
      daysEl.appendChild(pane);
    }

    if (width > 0) {
      daysEl.scrollLeft = activeIdx * width;
    }
    notifyActiveDay();
  }

  function updateNow(nowMin: number | null): void {
    renderNow(nowMin);
  }

  function scrollToTodayAndNow(todayIso: string | null, nowMin: number | null): void {
    // Default-day choice (ADR-0008): the caller passes today when it is a
    // festival day, or the configured fallback day otherwise.
    if (todayIso !== null) {
      const idx = schedule.days.findIndex((d) => d.date === todayIso);
      const width = daysEl.clientWidth;
      if (idx !== -1 && width > 0) {
        daysEl.scrollLeft = idx * width;
      }
    }

    // Scroll-to-now: fires only when the Now line is actually visible
    // (ADR-0008). One vertical scroll position for the whole schedule
    // (ADR-0012).
    if (nowMin !== null) {
      const nowTopPx = pxFromMin(nowMin, origin, pxPerMinute);
      container.scrollTop = Math.max(0, nowTopPx - container.clientHeight / 2);
    }

    notifyActiveDay();
  }

  daysEl.addEventListener("scroll", notifyActiveDay, { passive: true });
  window.addEventListener("resize", notifyActiveDay);

  if (onActTap) {
    // Delegated on the days layer — act blocks are rebuilt on every render,
    // so per-block listeners would not survive a repaint. The act is chosen
    // at pointerdown: within the slop the finger may end on a neighbour, and
    // the block it landed on is the one the user meant.
    let down: { x: number; y: number; actId: string | undefined } | null = null;
    let lastScrollAt = Number.NEGATIVE_INFINITY;

    // Both scroll axes disqualify a tap: vertical momentum lives on the
    // schedule container, horizontal day swipes on the days layer. Either
    // mid-gesture cancels; either just-before means the touch was spent
    // stopping the fling (ADR-0019's tap-vs-scroll discipline).
    const noteScroll = (): void => {
      lastScrollAt = performance.now();
      down = null;
    };
    container.addEventListener("scroll", noteScroll, { passive: true });
    daysEl.addEventListener("scroll", noteScroll, { passive: true });

    daysEl.addEventListener("pointerdown", (e) => {
      if (performance.now() - lastScrollAt < SCROLL_QUIET_MS) return;
      down = {
        x: e.clientX,
        y: e.clientY,
        actId: (e.target as Element).closest<HTMLElement>(".act")?.dataset.actId,
      };
    });
    daysEl.addEventListener("pointercancel", () => {
      down = null;
    });
    daysEl.addEventListener("pointerup", (e) => {
      if (down === null) return;
      const { x, y, actId } = down;
      down = null;
      if (Math.abs(e.clientX - x) > TAP_SLOP_PX || Math.abs(e.clientY - y) > TAP_SLOP_PX) return;
      if (actId) onActTap(actId);
    });
  }

  return { render, updateNow, scrollToTodayAndNow };
}

function buildRail(rail: HTMLElement, origin: TimeOrigin, pxPerMinute: number): void {
  const firstHour = Math.ceil(origin.startMin / 60);
  const lastHour = Math.floor(origin.endMin / 60);
  for (let h = firstHour; h <= lastHour; h++) {
    const minute = h * 60;
    if (minute < origin.startMin || minute > origin.endMin) continue;
    const el = document.createElement("div");
    el.className = "tick";
    el.style.top = `${pxFromMin(minute, origin, pxPerMinute)}px`;
    el.textContent = `${String(h).padStart(2, "0")}:00`;
    rail.appendChild(el);
  }
}

function renderStageRow(row: HTMLElement, visibleStages: Stage[]): void {
  row.replaceChildren();
  for (const stage of visibleStages) {
    const label = document.createElement("div");
    label.className = "stage-label";
    label.dataset.stageId = stage.id;
    label.style.setProperty("--stage-color", stage.color);
    label.textContent = stage.name;
    row.appendChild(label);
  }
}
