import { describe, expect, it } from "vitest";
import {
  easeProgress,
  moveKeyframe,
  snapTimelineTime,
  upsertKeyframe,
} from "./timeline";
describe("timeline", () => {
  it("replaces a property keyframe at the same time", () => {
    const first = { id: "1", time: 1, property: "x" as const, value: 10 };
    expect(upsertKeyframe([first], { ...first, id: "2", value: 20 })).toEqual([
      { ...first, id: "2", value: 20 },
    ]);
  });
  it("clamps moved keyframes", () => {
    expect(
      moveKeyframe([{ id: "1", time: 1, property: "x", value: 10 }], "1", 9)[0]
        .time,
    ).toBe(6);
  });
  it("keeps linear progress unchanged", () =>
    expect(easeProgress(0.25, "linear")).toBe(0.25));
  it("applies distinct easing curves", () => {
    expect(easeProgress(0.25, "ease-in")).toBeLessThan(0.25);
    expect(easeProgress(0.25, "ease-out")).toBeGreaterThan(0.25);
    expect(easeProgress(0.5, "ease-in-out")).toBe(0.5);
  });
  it("applies a custom cubic bezier", () =>
    expect(easeProgress(0.25, "custom", [0.42, 0, 1, 1])).toBeLessThan(0.25));
  it("snaps close to keyframes and otherwise to the tenth grid", () => {
    expect(snapTimelineTime(1.96, [2])).toBe(2);
    expect(snapTimelineTime(1.24, [])).toBe(1.2);
  });
});
