import { describe, expect, it } from "vitest";
import { createTextElement, type BannerElement, type Format } from "../model";
import { composeLayout } from "./layoutComposer";

const image = (id: string, name: string, width = 80): BannerElement => ({ id, name, kind: "image", text: "", assetUrl: `data:${id}`, x: 10, y: 10, width, scale: 100, rotation: 0, opacity: 100, fontFamily: "Arial", fontSize: 16, lineHeight: 100, color: "#000", locked: false, visible: true });
const format = (id: string, width: number, height: number): Format => ({ id, label: id, width, height, status: "ready" });

describe("deterministic layout composer", () => {
  it("covers a square with a landscape background", () => {
    const background = image("bg", "background-1200x628.jpg", 100);
    const [result] = composeLayout(format("square", 300, 250), [background], { bg: { width: 1200, height: 628 } });
    expect(result.width).toBeGreaterThan(100);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeCloseTo(0);
  });

  it("keeps foreground objects inside a portrait safe area", () => {
    const headline = { ...createTextElement(), id: "headline", text: "Очень длинный заголовок страхования", x: -20, y: 95, width: 130, fontSize: 90 };
    const [result] = composeLayout(format("portrait", 300, 600), [headline]);
    expect(result.x).toBeGreaterThanOrEqual(3);
    expect(result.x + result.width).toBeLessThanOrEqual(97);
    expect(result.y).toBeLessThan(96);
    expect(result.fontSize).toBeLessThanOrEqual(57);
  });

  it("limits text and UI blocks in a narrow strip", () => {
    const headline = { ...createTextElement(), id: "headline", text: "Основное текстовое поле", width: 90, fontSize: 60 };
    const ui = image("ui", "interface-frame.png", 90);
    const result = composeLayout(format("mobile", 320, 50), [headline, ui], { ui: { width: 600, height: 300 } });
    expect(result[0].fontSize).toBeLessThanOrEqual(19);
    expect(result[0].width).toBeLessThanOrEqual(48);
    expect(result[1].width).toBeLessThanOrEqual(38);
  });
});
