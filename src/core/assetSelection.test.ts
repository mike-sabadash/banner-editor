import { describe, expect, it } from "vitest";
import type { AssetLibraryItem, BannerElement, Format } from "../model";
import { applyBackgroundAsset, selectAssetCandidates, selectBackgroundAsset } from "./assetSelection";

const format: Format = { id: "medium", label: "Medium rectangle", width: 300, height: 250, status: "ready" };
const asset = (name: string, width: number, height: number, bytes: number): AssetLibraryItem => ({ id: name, name, width, height, bytes, assetUrl: `data:${name}` });

describe("AI asset candidate selection", () => {
  it("puts an exact named format ahead of a generic large source", () => {
    const selected = selectAssetCandidates([asset("background-large.jpg", 2400, 1600, 400_000), asset("background-300x250.jpg", 300, 250, 70_000)], format);
    expect(selected[0].name).toBe("background-300x250.jpg");
  });

  it("prefers a small variant when geometry is otherwise similar", () => {
    const selected = selectAssetCandidates([asset("hero.jpg", 600, 500, 480_000), asset("hero-size-s.jpg", 600, 500, 80_000)], format);
    expect(selected[0].name).toBe("hero-size-s.jpg");
  });
});

describe("format background selection", () => {
  const library = [
    asset("300x250-bg.jpg", 300, 250, 17_000),
    asset("300x600-bg.jpg", 300, 600, 54_000),
    asset("320_50-bg.jpg", 320, 50, 5_000),
    asset("728_90-bg.jpg", 728, 90, 12_000),
    asset("300x250-product.png", 300, 250, 8_000),
  ];

  it.each([
    ["medium", 300, 250, "300x250-bg.jpg"],
    ["half", 300, 600, "300x600-bg.jpg"],
    ["mobile", 320, 50, "320_50-bg.jpg"],
    ["leader", 728, 90, "728_90-bg.jpg"],
  ])("chooses the exact background for %s", (id, width, height, expected) => {
    expect(selectBackgroundAsset(library, { id, label: id, width, height, status: "ready" })?.name).toBe(expected);
  });

  it("replaces the master background while preserving its layer id", () => {
    const original: BannerElement = {
      id: "background-layer", kind: "image", name: "1200x628-bg.jpg", text: "", assetUrl: "data:master",
      x: 0, y: 0, width: 100, scale: 100, rotation: 0, opacity: 100, fontFamily: "Arial",
      fontSize: 16, lineHeight: 100, color: "#000", locked: false, visible: true,
    };
    const replacement = library[0];
    const [result] = applyBackgroundAsset([original], replacement);
    expect(result.id).toBe("background-layer");
    expect(result.name).toBe(replacement.name);
    expect(result.assetUrl).toBe(replacement.assetUrl);
    expect(result.width).toBe(100);
  });

  it("understands hyphens and a width-only filename from the real pixel geometry", () => {
    const selected = selectBackgroundAsset([
      asset("green-wide.jpg", 1200, 628, 40_000),
      asset("campaign-728-final.jpg", 728, 90, 12_000),
    ], { id: "leader", label: "Leaderboard", width: 728, height: 90, status: "ready" });
    expect(selected?.name).toBe("campaign-728-final.jpg");
  });

  it("does not mistake an exact-size foreground asset for a background", () => {
    const selected = selectBackgroundAsset([
      asset("product-300-250.png", 300, 250, 8_000),
      asset("promo-base-300.jpg", 300, 250, 17_000),
    ], { id: "medium", label: "Medium", width: 300, height: 250, status: "ready" });
    expect(selected?.name).toBe("promo-base-300.jpg");
  });
});
