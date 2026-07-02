# Service worker with silent auto-update

_Adopted from tonsoclock ADR-0013, unchanged._

Add a service worker (via `vite-plugin-pwa`) so an installed Øyablikk genuinely works on weak or no signal at Tøyenparken. Strategy: `NetworkFirst` for the navigation document (`index.html`) with a short timeout falling back to cache, `CacheFirst` for the hashed JS/CSS/font/icon assets. The document is *also* precached, so the fallback chain is live network → last document seen online → precached shell — even a first launch that happens to be offline serves the app rather than a broken page. The worker updates itself silently: the new bundle activates on the next cold launch, with no "reload to update" prompt.

This needs a small custom worker (`injectManifest`, `src/sw.ts`) rather than the generated one, because stock `generateSW` can't express "`NetworkFirst` with a precached fallback". This is what makes the install pitch in [0014](./0014-install-prompt-conditional-quiet-one-shot.md) honest. It extends [0011](./0011-no-third-party-requests-self-hosted-assets.md) rather than superseding it — the worker caches first-party assets only.

## Considered options

- **No service worker.** Rejected: the install benefit collapses to "fills the screen", too thin to interrupt anyone over.
- **`CacheFirst` for the document.** Rejected: a programme change would lurk un-fetched for an unpredictable duration. Festival data has to land within one launch of going online.
- **Explicit "update available, reload?" prompt.** Rejected: introduces a software-update surface in an app that is otherwise about a schedule.

## Consequences

- Cross-session staleness is bounded by one launch: the next online open fetches the new bundle, which activates on the launch after. In practice, "second look at the app" sees fresh data.
- Within a session the user always sees the bundle that loaded; worker updates happen behind the scenes.
