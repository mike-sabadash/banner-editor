import { describe, expect, it } from "vitest";
import {
  adaptMasterToFormat,
  fitPreview,
  formats,
  type BannerElement,
} from "./model";
describe("fitPreview", () => {
  it("keeps aspect ratio inside viewport", () => {
    expect(fitPreview(1200, 628)).toEqual({ width: 720, height: 377 });
    expect(fitPreview(300, 600)).toEqual({ width: 215, height: 430 });
  });
});

describe("master adaptation", () => {
  const base: BannerElement = {
    id: "hero",
    kind: "image",
    name: "Hero",
    text: "",
    x: 12,
    y: 8,
    width: 100,
    scale: 130,
    rotation: 0,
    opacity: 100,
    fontFamily: "Arial",
    fontSize: 16,
    lineHeight: 100,
    color: "#000",
    locked: false,
    visible: true,
  };
  it("covers target artboards with a large background", () => {
    const result = adaptMasterToFormat(
      [base],
      formats.find((item) => item.id === "mobile")!,
    );
    expect(result.elements[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 100,
      scale: 100,
    });
    expect(result.decisions[0].rule).toBe("cover-background");
  });
  it("reflows text for shallow formats", () => {
    const text = {
      ...base,
      id: "title",
      kind: "headline" as const,
      width: 45,
      fontSize: 48,
    };
    const result = adaptMasterToFormat(
      [text],
      formats.find((item) => item.id === "leader")!,
    );
    expect(result.elements[0].fontSize).toBeLessThan(48);
    expect(result.decisions[0].rule).toBe("strip-reflow");
  });
});
