import { describe, expect, it } from "vitest";
import { compositionLayout, layoutFamily } from "./resizeLabCompositions";

describe("Resize Lab composition presets", () => {
  it("selects layout families by aspect ratio", () => {
    expect(layoutFamily(240, 400)).toBe("portrait");
    expect(layoutFamily(300, 300)).toBe("square");
    expect(layoutFamily(728, 90)).toBe("landscape");
  });

  it("uses 24px horizontal and 32px vertical safe areas on the 240x400 master", () => {
    const layout = compositionLayout("composition-1", 240, 400);
    expect(layout.logo.x).toBe(10);
    expect(layout.logo.y).toBe(8);
    expect(layout.cta.x + layout.cta.w).toBe(90);
    expect(layout.cta.y).toBe(83);
  });

  it("keeps the 728x90 horizontal CTA 24px from the right edge", () => {
    const layout = compositionLayout("composition-1", 728, 90);
    expect(layout.cta.x + layout.cta.w).toBeCloseTo(96.7, 1);
    expect(layout.headline.x).toBeCloseTo(3.3, 1);
  });

  it("returns independent copies so manual movement remains a local override", () => {
    const first = compositionLayout("composition-1", 240, 400);
    first.logo.x = 90;
    expect(compositionLayout("composition-1", 240, 400).logo.x).toBe(10);
  });
});
