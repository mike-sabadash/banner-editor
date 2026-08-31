import { describe, expect, it } from "vitest";
import {
  easeProgress,
  interpolateValue,
  moveKeyframe,
  setEasingAtTime,
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
  it("recovers an invalid timeline coordinate instead of poisoning playback", () => {
    expect(snapTimelineTime(Number.NaN, [2])).toBe(0);
  });
  it("keeps playback alive with invalid persisted keyframes", () => {
    expect(interpolateValue(10, [undefined, null], "x", Number.NaN)).toBe(10);
  });
  it("applies a changed curve to the active keyframe", () => {
    const frames = [
      {
        id: "a",
        time: 1,
        property: "x" as const,
        value: 50,
        easing: "linear" as const,
      },
    ];
    expect(
      setEasingAtTime(frames, 1, "custom", [0.2, 0, 0.2, 1])[0],
    ).toMatchObject({ easing: "custom", bezier: [0.2, 0, 0.2, 1] });
  });
  it("applies easing to the segment ending at the next keyframe", () => {
    const frames = [
      {
        id: "a",
        time: 2,
        property: "x" as const,
        value: 50,
        easing: "linear" as const,
      },
    ];
    expect(
      setEasingAtTime(frames, 1, "ease-out", [0, 0, 0.58, 1])[0].easing,
    ).toBe("ease-out");
  });
});
