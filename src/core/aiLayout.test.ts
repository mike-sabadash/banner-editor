import { describe, expect, it } from "vitest";
import { createTextElement, type Format } from "../model";
import { applyDeltaPatches } from "./aiLayout";

const target: Format = { id: "mobile", label: "Mobile", width: 320, height: 50, status: "ready" };

describe("Anchor + Delta patching", () => {
  it("clamps hostile AI deltas and preserves the text safe area", () => {
    const anchor = { ...createTextElement(), id: "headline", x: 20, y: 20, width: 40, fontSize: 14 };
    const [result] = applyDeltaPatches([anchor], [{ id: anchor.id, dx: -999, dy: 999, dWidth: 999, dScale: 999, dFontSize: 999 }], target);
    expect(result.x).toBeGreaterThanOrEqual(4);
    expect(result.x + result.width).toBeLessThanOrEqual(96);
    expect(result.y).toBeLessThanOrEqual(96);
    expect(result.width).toBe(50);
    expect(result.fontSize).toBe(19);
    expect(result.scale).toBe(100);
  });

  it("never lets AI shrink a text box below ten percent", () => {
    const anchor = { ...createTextElement(), id: "copy", width: 12 };
    const [result] = applyDeltaPatches([anchor], [{ id: anchor.id, dx: 0, dy: 0, dWidth: -999, dScale: 0, dFontSize: 0 }], target);
    expect(result.width).toBe(10);
  });
});
