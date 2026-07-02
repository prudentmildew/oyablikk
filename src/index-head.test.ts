// Branding + asset wiring (issue #6): the document head carries the
// Øyablikk name, manifest, icons, and OG tags, and every asset it points at
// exists. The font stays self-hosted (ADR-0011) — no external font URLs.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("src/styles.css", "utf8");

describe("index.html head", () => {
  it("titles the app Øyablikk", () => {
    expect(html).toMatch(/<title>Øyablikk[^<]*<\/title>/);
  });

  it("links the manifest and both favicon flavours", () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('href="./manifest.webmanifest"');
    expect(html).toContain('href="./favicon.svg"');
    expect(html).toContain('rel="apple-touch-icon"');
  });

  it("carries OG and twitter tags with an absolute image URL", () => {
    expect(html).toMatch(/property="og:title"\s+content="Øyablikk/);
    expect(html).toMatch(/property="og:image"\s+content="https:\/\/[^"]+\/og\.png"/);
    expect(html).toContain('name="twitter:card"');
  });

  it("requests no third-party fonts or styles", () => {
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
  });
});

describe("manifest.webmanifest", () => {
  const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));

  it("names the app Øyablikk on black", () => {
    expect(manifest.name).toBe("Øyablikk");
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.theme_color).toBe("#000000");
  });

  it("keeps the stable '/' id and relative start_url/scope (ADR-0009)", () => {
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe(".");
    expect(manifest.scope).toBe(".");
  });

  it("lists ./-relative icons that actually exist in public/", () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith("./"), `${icon.src} is ./-relative (ADR-0009)`).toBe(true);
      expect(existsSync(`public/${icon.src}`), icon.src).toBe(true);
    }
  });
});

describe("branding assets", () => {
  it.each(["favicon.svg", "apple-touch-icon.png", "og.png", "icon-192.png", "icon-512.png"])(
    "public/%s exists",
    (f) => {
      expect(existsSync(`public/${f}`)).toBe(true);
    },
  );
});

describe("self-hosted display font (ADR-0011)", () => {
  it("declares Oswald from a bundled asset, not a CDN", () => {
    expect(css).toMatch(/@font-face[\s\S]*?src: url\("\.\/assets\/oswald[^"]+\.woff2"\)/);
    expect(existsSync("src/assets/oswald-latin-var.woff2")).toBe(true);
  });

  it("loads every stylesheet url() locally — no remote asset can sneak in", () => {
    for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      expect(url, `local url: ${url}`).toMatch(/^\.\//);
    }
  });
});

describe("the mark carries the palette (public/favicon.svg)", () => {
  // The favicon is generated from the edition palette; a palette tweak that
  // forgets to regenerate it must fail here, not drift silently.
  it("contains all six stage fills and the accent", async () => {
    const { ACCENT, OYA_2026 } = await import("../scripts/edition-config.ts");
    const svg = readFileSync("public/favicon.svg", "utf8");
    for (const stage of OYA_2026.stages) {
      expect(svg, `favicon carries ${stage.id}`).toContain(stage.color);
    }
    expect(svg).toContain(ACCENT);
  });
});
