/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so a custom-domain move needs zero code changes (ADR-0009).
  base: "./",
  test: {
    environment: "node",
  },
});
