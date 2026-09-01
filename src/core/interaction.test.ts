import { describe, expect, it } from "vitest";
import { animatedText, applyTextCase, rulerTicks, snapTimelineTime } from "./interaction";

describe("timeline interaction grid", () => {
  it("magnetically snaps near quarter-second divisions", () => {
    expect(snapTimelineTime(.247, 6, 1200)).toBe(.25);
    expect(snapTimelineTime(1.004, 6, 1200)).toBe(1);
  });

  it("falls back to the 30 fps frame grid away from magnetic targets", () => {
    expect(snapTimelineTime(.37, 6, 1200)).toBeCloseTo(11 / 30, 6);
  });

  it("builds major, medium and minor ruler ticks", () => {
    const ticks = rulerTicks(1);
    expect(ticks.map((tick) => tick.kind)).toEqual(["major", "minor", "medium", "minor", "major"]);
  });
});

describe("text behavior", () => {
  it("applies case behavior without changing stored source text", () => {
    expect(applyTextCase("summer sale", "uppercase")).toBe("SUMMER SALE");
    expect(applyTextCase("summer sale", "capitalize")).toBe("Summer Sale");
  });

  it("reveals typewriter text deterministically from timeline time", () => {
    const animation = { type: "typewriter" as const, typeSpeed: 100, cursor: false };
    expect(animatedText("Banner", .31, animation)).toBe("Ban");
    expect(animatedText("Banner", 2, animation)).toBe("Banner");
  });
});

