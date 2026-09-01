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

  it.each([
    ["medium", 300, 250],
    ["half", 300, 600],
    ["leader", 728, 90],
    ["mobile", 320, 50],
  ])("builds a role-aware anchor for %s", (id, width, height) => {
    const headline = { ...createTextElement(), id: "headline", text: "ОСНОВНОЕ ТЕКСТОВОЕ ПОЛЕ", width: 45, fontSize: 48 };
    const ui = image("ui", "Frame 2131329454.png", 60);
    const logo = image("logo", "Страховка.png", 28);
    const shield = image("shield", "shield.png", 5);
    const background = image("bg", "1200x628-bg.jpg", 100);
    const target = format(id, width, height);
    const result = composeLayout(target, [headline, ui, logo, shield, background], {
      ui: { width: 900, height: 260 }, logo: { width: 500, height: 90 }, shield: { width: 100, height: 120 }, bg: { width: 1200, height: 628 },
    }, { anchor: true });
    const byId = Object.fromEntries(result.map((element) => [element.id, element]));
    expect(byId.headline.x).toBeGreaterThanOrEqual(4);
    expect(byId.headline.x + byId.headline.width).toBeLessThanOrEqual(96);
    expect(byId.headline.fontSize).toBeLessThanOrEqual(height <= 60 ? 14 : height <= 100 ? 24 : 42);
    expect(byId.ui.x + byId.ui.width).toBeLessThanOrEqual(97);
    expect(byId.logo.x + byId.logo.width).toBeLessThan(byId.headline.x + byId.headline.width + 1);
    expect(byId.bg.width).toBeGreaterThanOrEqual(100);
  });

  it("preserves a centered master as a centered vertical rectangle composition", () => {
    const headline = { ...createTextElement(), id: "headline", text: "Страховка", x: 35, y: 31, width: 30, fontSize: 48, textAlign: "center" as const };
    const ui = { ...image("ui", "Frame 2131329454.png", 58), x: 21, y: 56 };
    const shield = { ...image("shield", "shield.png", 6), x: 47, y: 8 };
    const background = image("bg", "1200x628-bg.jpg", 100);
    const target = format("medium", 300, 250);
    const reference = [background, headline, shield, ui];
    const result = composeLayout(target, reference, {
      ui: { width: 900, height: 260 }, shield: { width: 100, height: 120 }, bg: { width: 300, height: 250 },
    }, { anchor: true, referenceFormat: format("master", 1200, 628), referenceElements: reference });
    const byId = Object.fromEntries(result.map((element) => [element.id, element]));
    const uiHeight = byId.ui.width / 100 * target.width * (260 / 900) / target.height * 100;
    expect(byId.shield.x + byId.shield.width / 2).toBeCloseTo(50);
    expect(byId.headline.x + byId.headline.width / 2).toBeCloseTo(50);
    expect(byId.headline.textAlign).toBe("center");
    expect(byId.ui.x + byId.ui.width / 2).toBeCloseTo(50);
    expect(byId.ui.y + uiHeight).toBeLessThanOrEqual(96);
  });

  it("preserves a non-centered composition and relative image proportions", () => {
    const headline = { ...createTextElement(), id: "headline", text: "Страховка", x: 12, y: 28, width: 30, fontSize: 48 };
    const ui = { ...image("ui", "Frame 2131329454.png", 50), x: 5, y: 52 };
    const shield = { ...image("shield", "shield.png", 5), x: 5, y: 8 };
    const background = image("bg", "1200x628-bg.jpg", 100);
    const reference = [background, headline, shield, ui];
    const result = composeLayout(format("medium", 300, 250), reference, {
      ui: { width: 900, height: 260 }, shield: { width: 100, height: 120 }, bg: { width: 1200, height: 628 },
    }, { anchor: true, referenceFormat: format("master", 1200, 628), referenceElements: reference });
    const byId = Object.fromEntries(result.map((element) => [element.id, element]));
    expect(Math.min(byId.shield.x, byId.ui.x)).toBeCloseTo(4);
    expect(byId.ui.width / byId.shield.width).toBeCloseTo(10);
    expect(byId.shield.y).toBeLessThan(byId.headline.y);
    expect(byId.headline.y).toBeLessThan(byId.ui.y);
  });
});
