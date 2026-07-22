import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The service worker is configured at build time (vite.config.ts), implemented
// in src/sw.ts (a custom injectManifest worker), and registered at run time
// (main.ts). These read the sources as text and assert the ADR-0013 decisions
// hold — the cheapest guard against the changes most likely to silently break
// them (flipping registerType back to "autoUpdate", or adding skipWaiting).
//
// Line comments are stripped first so the assertions test code, not the prose
// explaining it (which deliberately names the rejected options). Both files use
// `//` comments only; a block-comment strip would trip over the `/*` and `*/`
// inside the glob patterns.
function codeOf(relPath: string): string {
  return readFileSync(resolve(__dirname, relPath), "utf8").replace(/\/\/.*$/gm, "");
}

const viteConfig = codeOf("../vite.config.ts");
const sw = codeOf("sw.ts");
const mainTs = codeOf("main.ts");

describe("service worker — vite.config.ts (ADR-0013)", () => {
  it("wires vite-plugin-pwa with the custom injectManifest worker", () => {
    expect(viteConfig).toMatch(/from ["']vite-plugin-pwa["']/);
    expect(viteConfig).toContain("VitePWA(");
    expect(viteConfig).toContain('strategies: "injectManifest"');
    expect(viteConfig).toContain('filename: "sw.ts"');
  });

  it('updates silently via registerType "prompt", NOT "autoUpdate"', () => {
    // "autoUpdate" forces skipWaiting + clientsClaim and reloads the page
    // mid-session — the option ADR-0013 rejects. "prompt" leaves the new worker
    // waiting; with no refresh UI it activates on the next cold launch.
    expect(viteConfig).toContain('registerType: "prompt"');
    expect(viteConfig).not.toContain("autoUpdate");
  });

  it("keeps the hand-authored manifest (manifest: false)", () => {
    expect(viteConfig).toContain("manifest: false");
  });
});

describe("service worker — src/sw.ts (ADR-0013)", () => {
  it("precaches the app shell incl. the document for offline launches", () => {
    expect(sw).toContain("precacheAndRoute");
    // index.html is the offline fallback when the runtime cache is cold.
    expect(sw).toMatch(/matchPrecache\(\s*["']index\.html["']\s*\)/);
  });

  it("serves navigations NetworkFirst with a short timeout", () => {
    expect(sw).toContain("NetworkFirst");
    expect(sw).toMatch(/networkTimeoutSeconds:\s*\d/);
    expect(sw).toContain("oya-document");
    expect(sw).toMatch(/request\.mode === ["']navigate["']/);
  });

  it("never takes over mid-session — no skipWaiting / clientsClaim", () => {
    expect(sw).not.toContain("skipWaiting");
    expect(sw).not.toContain("clientsClaim");
  });
});

describe("service worker — registration in main.ts (ADR-0013)", () => {
  it("registers the worker from app start", () => {
    expect(mainTs).toMatch(/from ["']virtual:pwa-register["']/);
    expect(mainTs).toMatch(/registerSW\(/);
  });

  it("stays silent — no refresh prompt / auto-reload handler", () => {
    expect(mainTs).not.toContain("onNeedRefresh");
  });
});
