// Node 25 ships a `localStorage` global of its own. It wins over the one
// happy-dom installs, and without a `--localstorage-file` path it is an
// inert object — every `localStorage.getItem` in the suite throws
// "is not a function". Put happy-dom's Storage back, per test file.
Object.defineProperty(globalThis, "localStorage", {
  value: new Storage(),
  configurable: true,
  writable: true,
});
