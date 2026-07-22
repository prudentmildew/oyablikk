import { VitePWA } from "vite-plugin-pwa";
// vitest's defineConfig so the `test` block below is typed (the bare
// /// <reference> is inert once import sorting moves it off line 1).
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so a custom-domain move needs zero code changes (ADR-0009).
  base: "./",
  plugins: [
    VitePWA({
      // Custom service worker (src/sw.ts) so we can precache the document for
      // offline AND keep NetworkFirst for freshness — see that file and
      // ADR-0013. generateSW can't express "NetworkFirst with a precache
      // fallback", hence injectManifest.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      // ADR-0013: silent update. We register from main.ts ourselves
      // (injectRegister: false) and deliberately do NOT use
      // registerType: "autoUpdate" — that flag forces skipWaiting +
      // clientsClaim and reloads the page mid-session, which ADR-0013
      // rejects. "prompt" leaves the new worker waiting; with no refresh UI
      // wired up it activates silently on the next cold launch.
      registerType: "prompt",
      injectRegister: false,
      // The manifest is hand-authored in public/manifest.webmanifest; don't
      // let the plugin generate one.
      manifest: false,
      injectManifest: {
        // First-party app shell to precache, incl. index.html (ADR-0011).
        globPatterns: ["**/*.{js,css,html,webmanifest,woff2,png,svg,ico}"],
      },
    }),
  ],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
