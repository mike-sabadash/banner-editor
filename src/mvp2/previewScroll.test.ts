// @ts-nocheck
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("all-formats preview scrolling", () => {
  const css = readFileSync(new URL("../web-scene/editorProductV2.css", import.meta.url), "utf8");

  it("owns a vertical scroll container", () => {
    expect(css).toMatch(/\.bm-campaign-wall\{[^}]*height:100vh[^}]*overflow-y:auto/);
    expect(css).toMatch(/\.bm-campaign-wall-grid\{[^}]*padding-bottom:48px/);
  });

  it("can skip initial rendering work for off-screen cards", () => {
    expect(css).toMatch(/\.bm-campaign-card\{[^}]*content-visibility:auto[^}]*contain-intrinsic-size:360px/);
  });
});
