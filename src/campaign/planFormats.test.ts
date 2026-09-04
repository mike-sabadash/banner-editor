import { describe, expect, it } from "vitest";
import { formatsFromPlacements, normalizePlanSize } from "./planFormats";

describe("delivery-plan format normalization", () => {
  it("normalizes x, multiplication sign and Cyrillic х", () => {
    expect(normalizePlanSize({ size: "300x250" })?.size).toBe("300×250");
    expect(normalizePlanSize({ size: "300 × 250" })?.size).toBe("300×250");
    expect(normalizePlanSize({ size: "300 х 250" })?.size).toBe("300×250");
  });

  it("deduplicates repeated creative sizes while preserving placements and platforms", () => {
    const formats = formatsFromPlacements([
      { platform: "Yandex", size: "300x250" },
      { platform: "VK Ads", width: 300, height: 250 },
      { platform: "Yandex", size: "728×90" },
    ]);
    expect(formats).toHaveLength(2);
    const medium = formats.find((f) => f.id === "format-300x250");
    expect(medium?.placements).toHaveLength(2);
    expect(medium?.platforms).toEqual(["Yandex", "VK Ads"]);
    expect(medium?.size).toBe("300×250");
  });

  it("marks conflicting TT without hiding original placements", () => {
    const [format] = formatsFromPlacements([
      { platform: "A", size: "300×250", requirements: { maxZipKb: 150, maxDurationSec: 15, tracking: true } },
      { platform: "B", size: "300×250", requirements: { maxZipKb: 200, maxDurationSec: 20, tracking: true } },
    ]);
    expect(format.placements).toHaveLength(2);
    expect(format.conflicts).toContain("Max ZIP");
    expect(format.conflicts).toContain("Duration");
    expect(format.conflicts).not.toContain("Tracking");
  });
});
