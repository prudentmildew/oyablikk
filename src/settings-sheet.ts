// Settings: a bottom-sheet overlay reached via the Header gear. Default page
// holds the Stage filter plus a link to the About page; the sheet swaps
// between the two (CONTEXT.md §Settings/§About).
import type { Stage } from "./schedule.ts";

export type SettingsSheetOptions = {
  stages: Stage[];
  /** Initial hidden set — the sheet owns and mutates its own copy. */
  hidden: ReadonlySet<string>;
  onChange: (hidden: ReadonlySet<string>) => void;
};

export type SettingsSheet = {
  element: HTMLElement;
  open(): void;
  close(): void;
};

export function createSettingsSheet(opts: SettingsSheetOptions): SettingsSheet {
  const { stages, onChange } = opts;
  const hidden = new Set(opts.hidden);

  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.hidden = true;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Settings");
  backdrop.appendChild(sheet);

  const settingsPage = buildSettingsPage(stages, hidden, onChange, close, showAbout);
  const aboutPage = buildAboutPage(close, showSettings);
  aboutPage.hidden = true;
  sheet.append(settingsPage, aboutPage);

  function showSettings(): void {
    settingsPage.hidden = false;
    aboutPage.hidden = true;
  }

  function showAbout(): void {
    settingsPage.hidden = true;
    aboutPage.hidden = false;
  }

  function open(): void {
    // Always land on the Settings page, wherever the sheet was last closed.
    showSettings();
    backdrop.hidden = false;
  }

  function close(): void {
    backdrop.hidden = true;
  }

  return { element: backdrop, open, close };
}

function buildPageHeader(title: string, close: () => void): HTMLElement {
  const header = document.createElement("header");
  header.className = "sheet-header";
  const heading = document.createElement("h2");
  heading.className = "sheet-title";
  heading.textContent = title;
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "sheet-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", close);
  header.append(heading, closeButton);
  return header;
}

function buildSettingsPage(
  stages: Stage[],
  hidden: Set<string>,
  onChange: (hidden: ReadonlySet<string>) => void,
  close: () => void,
  showAbout: () => void,
): HTMLElement {
  const page = document.createElement("div");
  page.className = "sheet-page sheet-page-settings";
  page.appendChild(buildPageHeader("Settings", close));

  const filter = document.createElement("fieldset");
  filter.className = "stage-filter";
  const legend = document.createElement("legend");
  legend.textContent = "Stages";
  filter.appendChild(legend);

  for (const stage of stages) {
    const label = document.createElement("label");
    label.className = "stage-filter-option";
    label.style.setProperty("--stage-color", stage.color);

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = stage.id;
    box.checked = !hidden.has(stage.id);
    box.addEventListener("change", () => {
      if (box.checked) {
        hidden.delete(stage.id);
      } else {
        hidden.add(stage.id);
      }
      onChange(hidden);
    });

    const name = document.createElement("span");
    name.textContent = stage.name;

    label.append(box, name);
    filter.appendChild(label);
  }

  page.appendChild(filter);

  const footer = document.createElement("footer");
  footer.className = "sheet-footer";
  const aboutLink = document.createElement("button");
  aboutLink.type = "button";
  aboutLink.className = "about-link";
  aboutLink.textContent = "About Øyablikk";
  aboutLink.addEventListener("click", showAbout);
  footer.appendChild(aboutLink);
  page.appendChild(footer);

  return page;
}

function buildAboutPage(close: () => void, showSettings: () => void): HTMLElement {
  const page = document.createElement("div");
  page.className = "sheet-page sheet-page-about";

  const header = buildPageHeader("About", close);
  const back = document.createElement("button");
  back.type = "button";
  back.className = "about-back";
  back.setAttribute("aria-label", "Back to Settings");
  back.textContent = "‹";
  back.addEventListener("click", showSettings);
  header.prepend(back);
  page.appendChild(header);

  const body = document.createElement("div");
  body.className = "about-body";
  // Purely informational (CONTEXT.md §About): origin note, disclaimer,
  // privacy statement (ADR-0016), install fallback (placeholder until the
  // PWA slice lands).
  const paragraphs = [
    "I built Øyablikk because I wanted the Øya park programme the way I " +
      "actually use it at the festival: one glanceable screen, the stages " +
      "side by side, and a line marking right now. It is a sibling of Tons " +
      "o'Clock, the same idea built for Tons of Rock.",
    "Øyablikk is an unaffiliated fan project. It is not made by, endorsed " +
      "by, or connected to Øyafestivalen. The programme is Øya's published " +
      "schedule and can change without notice — trust the official channels " +
      "over this app.",
    "Privacy: your favourites and settings live in your browser's " +
      "localStorage and never leave your device. The only network request " +
      "beyond loading the app itself is a single anonymous page-view beacon " +
      "to Cloudflare Web Analytics — no cookies, no fingerprinting, no " +
      "cross-site tracking.",
    "Install: open this site in your phone's browser and choose " +
      "“Add to Home Screen” (the share menu on iOS, the browser " +
      "menu on Android) to keep it one tap away, full screen.",
  ];
  for (const text of paragraphs) {
    const p = document.createElement("p");
    p.textContent = text;
    body.appendChild(p);
  }
  page.appendChild(body);

  return page;
}
