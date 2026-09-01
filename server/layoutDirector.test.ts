import { describe, expect, it } from "vitest";
import { buildPrompt, sanitize, type LayoutDirectorRequest } from "./layoutDirector";

const request: LayoutDirectorRequest = {
  phase: "plan",
  master: { width: 1200, height: 628, elements: [] },
  target: { id: "mobile", width: 320, height: 50, elements: [{ id: "headline", role: "headline", kind: "headline", name: "Headline", text: "Text", x: 4, y: 4, width: 40, scale: 100, fontSize: 14, lineHeight: 110, visible: true }] },
};

describe("layout director delta contract", () => {
  it("asks for deltas instead of absolute coordinates", () => {
    const prompt = buildPrompt(request);
    expect(prompt).toContain('"dx":0');
    expect(prompt).toContain("ONLY relative DELTAS");
    expect(prompt).not.toContain('"x":0,"y":0');
  });

  it("sanitizes unknown ids and clamps oversized deltas", () => {
    const result = sanitize({ rationale: "test", elements: [
      { id: "headline", dx: 200, dy: -200, dWidth: 80, dScale: -80, dFontSize: 50 },
      { id: "invented", dx: 1, dy: 1, dWidth: 1, dScale: 1, dFontSize: 1 },
    ] }, request);
    expect(result.elements).toEqual([{ id: "headline", dx: 8, dy: -8, dWidth: 10, dScale: -10, dFontSize: 6 }]);
  });
});
