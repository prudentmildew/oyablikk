// Custom service worker built via vite-plugin-pwa's injectManifest strategy.
// Typechecked separately against the WebWorker lib (tsconfig.worker.json) since
// this runs in a ServiceWorkerGlobalScope, not the DOM.
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

// vite-plugin-pwa injects the precache manifest here at build time.
const precacheManifest = (
  self as unknown as {
    __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
  }
).__WB_MANIFEST;

// Precache the whole first-party app shell — hashed JS/CSS/fonts/icons AND
// index.html — so a phone with no signal in Tøyenparken always has a complete
// app to launch (ADR-0013). Hashed assets are CacheFirst-equivalent: an entry
// is only refetched when its content hash changes.
//
// directoryIndex: "" stops the precache route from answering "/" navigations
// from index.html cache-first; navigations go through the NetworkFirst route
// below instead. index.html stays in the precache cache, reachable via
// matchPrecache as the offline fallback.
precacheAndRoute(precacheManifest, { directoryIndex: "" });
cleanupOutdatedCaches();

// NetworkFirst for the navigation document so a redeploy's new bundle lands
// within one online launch. Fallback order: live network → last document seen
// online (runtime cache) → the precached shell. That last hop is what makes
// "works without signal" honest even when the first launch under the service
// worker is offline, before the runtime cache is warm.
const networkFirstDocument = new NetworkFirst({
  cacheName: "oya-document",
  networkTimeoutSeconds: 3,
  plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
});

registerRoute(
  ({ request }) => request.mode === "navigate",
  async (options) => {
    const networked = await networkFirstDocument.handle(options).catch(() => undefined);
    if (networked) return networked;
    const precached = await matchPrecache("index.html");
    return precached ?? Response.error();
  },
);

// No skipWaiting / clientsClaim (ADR-0013): the updated worker waits and takes
// over on the next cold launch, never mid-session. With registerType "prompt"
// and no refresh UI in main.ts, that update stays silent.
