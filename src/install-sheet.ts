// Install prompt: a quiet one-shot bottom sheet on the second-calendar-day
// visit (ADR-0014). Reuses the Settings sheet's shell so the visual language
// and dismiss conventions match.
export type InstallSheet = {
  element: HTMLElement;
  open(): void;
  close(): void;
};

export type InstallSheetOptions = {
  /** "ios" shows instructional copy with the Share glyph; "android" an Install button. */
  platform: "ios" | "android";
  /** Triggers the native install on Android; unused on iOS (no button there). */
  onInstall?: () => void;
};

// The iOS Share glyph (square with an up-arrow) anchors the instruction the way
// Safari's own toolbar does. Same stroke idiom as the app's other inline SVGs.
export const SHARE_GLYPH = `<svg class="install-share-glyph" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><polyline points="8 7 12 3 16 7"/><path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></svg>`;

export function createInstallSheet(opts: InstallSheetOptions): InstallSheet {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.hidden = true;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  const sheet = document.createElement("div");
  sheet.className = "sheet install-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Add to home screen");
  backdrop.appendChild(sheet);

  const header = document.createElement("header");
  header.className = "sheet-header";
  const title = document.createElement("h2");
  title.className = "sheet-title install-title";
  title.textContent = "Add it to your home screen";
  // Close affordance: the same X as Settings. No "not now" / "maybe later" —
  // the sheet is one-shot, so a soft deferral would promise a return visit
  // that never comes (ADR-0014).
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "sheet-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", close);
  header.append(title, closeButton);
  sheet.appendChild(header);

  const subtitle = document.createElement("p");
  subtitle.className = "install-subtitle";
  subtitle.textContent =
    "Then it works without signal — useful in Tøyenparken, where there often isn't any.";
  sheet.appendChild(subtitle);

  const body = document.createElement("div");
  body.className = "install-body";
  if (opts.platform === "ios") {
    const instruction = document.createElement("p");
    instruction.className = "install-instruction";
    // Static, author-controlled copy — no user input — so innerHTML is safe.
    instruction.innerHTML = `Tap ${SHARE_GLYPH} in Safari, then <strong>Add to Home Screen</strong>.`;
    body.appendChild(instruction);
  } else {
    const installButton = document.createElement("button");
    installButton.type = "button";
    installButton.className = "install-button";
    installButton.textContent = "Install";
    installButton.addEventListener("click", () => opts.onInstall?.());
    body.appendChild(installButton);
  }
  sheet.appendChild(body);

  // The one-shot is persisted by the caller on open, so dismissal just hides
  // the sheet — there is nothing to reset.
  function open(): void {
    backdrop.hidden = false;
  }

  function close(): void {
    backdrop.hidden = true;
  }

  return { element: backdrop, open, close };
}
