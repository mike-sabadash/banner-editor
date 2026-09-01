import { describe, expect, it } from "vitest";
import type { AssetLibraryItem, Format } from "../model";
import { selectAssetCandidates } from "./assetSelection";

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
